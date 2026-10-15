import crypto from 'crypto';
import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom';
import { PlayerNumber } from '../../constant/plateau';
import { verifyAccessToken } from '../services/token';
import { avatarUrl, getUserById } from '../repositories/user_repositories';
import { saveGame } from '../repositories/game_repositories';
import { config } from '../config';

const MAX_ROOMS = 500;
const MAX_ROOM_ID_LENGTH = 64;
const MAX_EVENTS_PER_SECOND = 20;
// Nom de partie : 1 à 30 caractères, sans caractères de contrôle. Mot de passe : 50 caractères au plus.
const ROOM_NAME_REGEX = /^[^\p{Cc}]{1,30}$/u;
const MAX_ROOM_PASSWORD_LENGTH = 50;
// Mauvais mots de passe tolérés par compte et par fenêtre de temps (contre les essais en série).
const MAX_PASSWORD_ATTEMPTS = 10;
const PASSWORD_ATTEMPTS_WINDOW_MS = 10 * 60 * 1000;
// Le joueur a retourné une carte de son talon : il doit la jouer avant toute autre.
const DRAWN_CARD_FIRST = "Jouez d'abord la carte piochée, ou posez-la sur votre défausse.";
const LOBBY = 'lobby'; // canal des sockets qui regardent la liste des parties
// Chat : 300 caractères par message, et au plus 5 messages par tranche de 5 secondes par joueur.
const MAX_CHAT_LENGTH = 300;
const MAX_CHAT_MESSAGES = 5;
const CHAT_WINDOW_MS = 5000;

const ADMIN_ACTIONS = ['nearly_win', 'give_turn', 'force_win', 'new_game'] as const;
type AdminAction = (typeof ADMIN_ACTIONS)[number];

const rooms = new Map<string, GameRoom>();

// Partie que ce joueur a quittée et peut encore reprendre (bouton « Reprendre » de l'accueil).
function findPausedGame(userId: number) {
  for (const [roomId, room] of rooms) {
    const paused = room.pausedGameOf(userId);
    if (paused) return { roomId, name: room.name, ...paused };
  }
  return null;
}

// Parties en attente d'un adversaire, de la plus récente à la plus ancienne.
function lobbyList() {
  return [...rooms]
    .map(([roomId, room]) => ({ roomId, createdAt: room.createdAt, entry: room.lobbyEntry() }))
    .filter((room) => room.entry)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ roomId, entry }) => ({ roomId, ...entry! }));
}

const passwordAttempts = new Map<number, { count: number; since: number }>();

// Compte un mauvais mot de passe ; renvoie faux si le compte a fait trop d'essais récemment.
function allowPasswordAttempt(userId: number): boolean {
  const now = Date.now();
  const attempts = passwordAttempts.get(userId);
  if (!attempts || now - attempts.since > PASSWORD_ATTEMPTS_WINDOW_MS) {
    passwordAttempts.set(userId, { count: 1, since: now });
    return true;
  }
  return ++attempts.count <= MAX_PASSWORD_ATTEMPTS;
}

// Canal privé de chaque compte (tous ses onglets), pour le prévenir où qu'il soit sur le site.
const userChannel = (userId: number) => `user:${userId}`;

const isRoomId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= MAX_ROOM_ID_LENGTH;

// Lit un cookie dans l'en-tête de la connexion socket.
const readCookie = (header: string | undefined, name: string) =>
  header?.split('; ').find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

export function setupGameSockets(io: Server) {
  // Envoie l'état aux deux joueurs, et enregistre la partie dans l'historique dès qu'elle est finie.
  const sendState = (roomId: string, room: GameRoom) => {
    const result = room.takeResult();
    if (result) saveGame(result).catch((err) => console.error('[DB] Partie non enregistrée :', err));
    io.to(roomId).emit('game_state', room.state());
  };

  // Deux minuteurs par table : forfait d'un joueur absent, et destruction de la table quand plus
  // personne n'y est connecté (une partie en cours est alors annulée, sans rien enregistrer).
  const forfeitTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const closeTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const setTimer = (timers: typeof forfeitTimers, roomId: string, at: number | null, callback: () => void) => {
    clearTimeout(timers.get(roomId));
    timers.delete(roomId);
    if (at !== null) timers.set(roomId, setTimeout(callback, Math.max(0, at - Date.now()) + 100));
  };

  // Prévient ces joueurs, où qu'ils soient sur le site, de l'état de leur partie en pause
  // (bouton « Reprendre » de l'accueil : forfait, annulation, ou plus rien à reprendre).
  const notifyPaused = (userIds: number[]) => {
    for (const userId of userIds) io.to(userChannel(userId)).emit('paused_game', findPausedGame(userId));
  };

  // À appeler après chaque arrivée ou départ d'un joueur.
  const armTimers = (roomId: string, room: GameRoom) => {
    setTimer(forfeitTimers, roomId, room.nextForfeitAt(), () => {
      if (rooms.get(roomId) !== room || !room.applyForfeits()) return;
      sendState(roomId, room);
      notifyPaused(room.seatedUserIds());
    });
    setTimer(closeTimers, roomId, room.closesAt, () => {
      if (rooms.get(roomId) !== room || room.hasConnections()) return;
      const userIds = room.seatedUserIds();
      deleteRoom(roomId);
      notifyPaused(userIds);
    });
  };

  const deleteRoom = (roomId: string) => {
    for (const timers of [forfeitTimers, closeTimers]) {
      clearTimeout(timers.get(roomId));
      timers.delete(roomId);
    }
    rooms.delete(roomId);
    broadcastLobby();
  };

  // Liste des parties en attente, envoyée en direct à ceux qui regardent le menu « Jouer ».
  const broadcastLobby = () => io.to(LOBBY).emit('lobby', lobbyList());

  // Le joueur du socket quitte sa table : bouton « Menu principal », onglet fermé ou coupure réseau.
  const leaveRoom = (socket: Socket) => {
    const { roomId, userId } = socket.data;
    const room = rooms.get(roomId);
    socket.data.roomId = undefined;
    socket.leave(roomId);
    if (!room) return;

    const userIds = room.seatedUserIds();
    room.leave(userId);
    if (room.isEmpty()) {
      deleteRoom(roomId);
    } else {
      armTimers(roomId, room);
      broadcastLobby();
      // Partie en cours : l'adversaire voit le compte à rebours. Sinon, il attend un nouvel adversaire.
      if (room.board) sendState(roomId, room);
      else io.to(roomId).emit('waiting_for_opponent');
      io.to(roomId).emit('chat_history', room.chatHistory()); // vidé si la place s'est libérée
    }
    notifyPaused(userIds);
  };

  // Seuls les joueurs connectés à un compte peuvent jouer : le compte (cookie d'auth) sert
  // à l'historique des parties et au rôle admin. Le front rafraîchit son token puis réessaie.
  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, 'access_token');
    const tokenUser = token ? verifyAccessToken(decodeURIComponent(token)) : null;
    const user = tokenUser ? await getUserById(tokenUser.id).catch(() => null) : null;
    if (!user) {
      next(new Error('unauthorized'));
      return;
    }
    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.avatarUrl = avatarUrl(user);
    socket.data.isAdmin = user.isAdmin;
    next();
  });

  io.on('connection', (socket: Socket) => {
    socket.join(userChannel(socket.data.userId));

    // Anti-flood : au-delà de MAX_EVENTS_PER_SECOND messages par seconde, les suivants sont ignorés.
    let windowStart = Date.now();
    let eventCount = 0;
    socket.use((_event, next) => {
      const now = Date.now();
      if (now - windowStart > 1000) {
        windowStart = now;
        eventCount = 0;
      }
      if (++eventCount <= MAX_EVENTS_PER_SECOND) next();
    });

    const myRoom = () => rooms.get(socket.data.roomId);
    const mySeat = () => myRoom()?.playerNumber(socket.data.userId) ?? null;

    // Le plateau de la partie du socket, uniquement si c'est à lui de jouer et que la partie n'est pas finie.
    const myTurnBoard = () => {
      const room = myRoom();
      const board = room?.board;
      if (!room || !board || board.winner || mySeat() !== board.activePlayer) return null;
      return { room, board };
    };

    // Accueil : la partie en pause du joueur, puis ses changements en direct (voir notifyPaused).
    socket.on('watch_paused', () => socket.emit('paused_game', findPausedGame(socket.data.userId)));

    // Menu « Jouer » : la liste des parties en attente, puis ses mises à jour en direct.
    socket.on('watch_lobby', () => {
      socket.join(LOBBY);
      socket.emit('lobby', lobbyList());
    });

    // Crée une partie (nom affiché, mot de passe facultatif) et renvoie son identifiant.
    // L'identifiant est aléatoire : on ne peut pas deviner l'adresse d'une table.
    socket.on('create_room', (payload: { name?: unknown; password?: unknown }, ack: unknown) => {
      if (typeof ack !== 'function') return;
      const { name, password } = payload ?? {};
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!ROOM_NAME_REGEX.test(trimmedName)) {
        ack({ error: 'Nom de partie : 1 à 30 caractères.' });
        return;
      }
      if (password !== undefined && (typeof password !== 'string' || password.length > MAX_ROOM_PASSWORD_LENGTH)) {
        ack({ error: `Mot de passe : ${MAX_ROOM_PASSWORD_LENGTH} caractères au plus.` });
        return;
      }
      // Une seule partie en attente par joueur : la précédente, encore sans adversaire, est fermée.
      for (const [id, other] of rooms) {
        if (other.isOwnedBy(socket.data.userId) && !other.board) {
          io.to(id).emit('room_error', 'Vous avez créé une autre partie : celle-ci est fermée.');
          io.in(id).socketsLeave(id);
          deleteRoom(id);
        }
      }
      if (rooms.size >= MAX_ROOMS) {
        ack({ error: 'Le serveur est plein, réessayez plus tard.' });
        return;
      }

      const roomId = crypto.randomBytes(9).toString('base64url');
      const room = new GameRoom({ forfeitDelayMs: config.forfeitDelayMs, name: trimmedName, ownerId: socket.data.userId, password });
      rooms.set(roomId, room);
      armTimers(roomId, room); // détruite si personne ne la rejoint
      ack({ roomId });
    });

    // Rejoindre une partie. La place est liée au compte : un joueur qui revient
    // (même depuis un autre appareil) reprend la partie, sans redonner le mot de passe.
    socket.on('join_room', (payload: { roomId?: unknown; password?: unknown }) => {
      const { roomId, password } = payload ?? {};
      if (!isRoomId(roomId) || socket.data.roomId) return;

      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('room_error', "Cette partie n'existe plus.");
        return;
      }
      if (!room.canEnter(socket.data.userId, password)) {
        if (password !== undefined && !allowPasswordAttempt(socket.data.userId)) {
          socket.emit('room_error', 'Trop de mauvais mots de passe, réessayez dans quelques minutes.');
          return;
        }
        socket.emit('password_required', { name: room.name, wrong: password !== undefined });
        return;
      }

      const seat = room.join({ id: socket.data.userId, username: socket.data.username, avatarUrl: socket.data.avatarUrl });
      if (!seat) {
        socket.emit('room_error', 'La table est déjà pleine !');
        return;
      }
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.emit('seat', { seat, name: room.name, locked: room.isLocked });
      socket.emit('chat_history', room.chatHistory());

      armTimers(roomId, room);
      broadcastLobby();
      notifyPaused(room.seatedUserIds()); // le retour d'un joueur change le compte à rebours de l'autre
      if (room.board) sendState(roomId, room); // l'adversaire voit aussi le retour du joueur
      else socket.emit('waiting_for_opponent');
    });

    // Chat entre les deux joueurs de la table (avant, pendant et après la partie).
    let chatTimes: number[] = [];
    socket.on('chat_send', (text: unknown) => {
      const room = myRoom();
      if (!room || typeof text !== 'string') return;
      // Les caractères de contrôle (retours à la ligne compris) deviennent des espaces.
      const clean = text.replace(/\p{Cc}/gu, ' ').trim().slice(0, MAX_CHAT_LENGTH);
      if (!clean) return;
      const now = Date.now();
      chatTimes = chatTimes.filter((at) => now - at < CHAT_WINDOW_MS);
      if (chatTimes.length >= MAX_CHAT_MESSAGES) {
        socket.emit('action_error', 'Doucement : attendez quelques secondes avant le prochain message.');
        return;
      }
      chatTimes.push(now);
      const message = room.addChatMessage(socket.data.userId, clean, now);
      if (message) io.to(socket.data.roomId).emit('chat_message', message);
    });

    socket.on('leave_room', () => leaveRoom(socket));
    socket.on('disconnect', () => leaveRoom(socket));

    socket.on('draw_card', () => {
      const game = myTurnBoard();
      if (!game) return;
      if (!game.board.draw()) socket.emit('action_error', 'Vous ne pouvez pas piocher maintenant.');
      sendState(socket.data.roomId, game.room);
    });

    socket.on('move_card', (payload: { from?: unknown; to?: unknown }) => {
      const { from, to } = payload ?? {};
      const game = myTurnBoard();
      if (!game || typeof from !== 'string' || typeof to !== 'string') return;
      if (!game.board.move(from, to)) socket.emit('action_error', game.board.hasDrawnCard() ? DRAWN_CARD_FIRST : 'Coup interdit.');
      sendState(socket.data.roomId, game.room);
    });

    socket.on('pass_turn', () => {
      const game = myTurnBoard();
      if (!game) return;
      game.board.passTurn();
      sendState(socket.data.roomId, game.room);
    });

    // Seul l'adversaire du joueur actif peut crier « Crapette ! ».
    socket.on('call_crapette', () => {
      const room = myRoom();
      const board = room?.board;
      const caller = mySeat();
      if (!room || !board || !caller || caller === board.activePlayer) return;

      if (!board.callCrapette()) {
        socket.emit('action_error', 'Pas de faute : la Crapette est refusée.');
        return;
      }
      io.to(socket.data.roomId).emit('crapette_called', caller);
      sendState(socket.data.roomId, room);
    });

    socket.on('play_again', () => {
      const room = myRoom();
      if (room?.voteRematch(socket.data.userId)) sendState(socket.data.roomId, room);
    });

    // Outils de test réservés aux comptes admin. `target` : 'me' ou 'opponent'.
    socket.on('admin_action', (payload: { action?: unknown; target?: unknown }) => {
      const { action, target } = payload ?? {};
      const room = myRoom();
      const board = room?.board;
      const me = mySeat();
      if (!socket.data.isAdmin || !room || !board || !me) return;
      if (!ADMIN_ACTIONS.includes(action as AdminAction)) return;

      const player = (target === 'opponent' ? 3 - me : me) as PlayerNumber;
      if (action === 'nearly_win') board.adminNearlyWin(player);
      else if (action === 'give_turn') board.adminGiveTurn(player);
      else if (action === 'force_win') board.adminForceWin(player);
      else room.newGame();
      armTimers(socket.data.roomId, room);
      sendState(socket.data.roomId, room);
    });
  });
}
