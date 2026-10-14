import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom';
import { PlayerNumber } from '../../constant/plateau';
import { verifyAccessToken } from '../services/token';
import { avatarUrl, getUserById } from '../repositories/user_repositories';
import { saveGame } from '../repositories/game_repositories';

const MAX_ROOMS = 500;
const MAX_ID_LENGTH = 64; // nom de table et jeton joueur
const MAX_EVENTS_PER_SECOND = 20;
// Une table sans aucun joueur connecté est supprimée après ce délai (laisse le temps d'un F5 ou d'une coupure).
const EMPTY_ROOM_TTL_MS = 10 * 60 * 1000;

const ADMIN_ACTIONS = ['nearly_win', 'give_turn', 'force_win', 'new_game'] as const;
type AdminAction = (typeof ADMIN_ACTIONS)[number];

const rooms = new Map<string, GameRoom>();

const isId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;

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

  // Supprime la table plus tard si plus personne n'y est connecté.
  const scheduleCleanup = (roomId: string) => {
    setTimeout(() => {
      if (!io.sockets.adapter.rooms.get(roomId)?.size) rooms.delete(roomId);
    }, EMPTY_ROOM_TTL_MS);
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
    const mySeat = () => myRoom()?.playerNumber(socket.data.token) ?? null;

    // Le plateau de la partie du socket, uniquement si c'est à lui de jouer et que la partie n'est pas finie.
    const myTurnBoard = () => {
      const room = myRoom();
      const board = room?.board;
      if (!room || !board || board.winner || mySeat() !== board.activePlayer) return null;
      return { room, board };
    };

    // `token` : jeton secret généré par le navigateur, qui permet de retrouver sa place après un rechargement.
    socket.on('join_room', (payload: { roomId?: unknown; token?: unknown }) => {
      const { roomId, token } = payload ?? {};
      if (!isId(roomId) || !isId(token) || socket.data.roomId) return;

      if (!rooms.has(roomId) && rooms.size >= MAX_ROOMS) {
        socket.emit('room_error', 'Le serveur est plein, réessayez plus tard.');
        return;
      }
      const room = rooms.get(roomId) ?? new GameRoom();
      rooms.set(roomId, room);

      const seat = room.join(token, { id: socket.data.userId, username: socket.data.username, avatarUrl: socket.data.avatarUrl });
      if (!seat) {
        socket.emit('room_error', 'La table est déjà pleine !');
        return;
      }
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.token = token;
      socket.emit('seat', seat);

      if (room.board) sendState(roomId, room);
      else socket.emit('waiting_for_opponent');
    });

    socket.on('leave_room', () => {
      const { roomId, token } = socket.data;
      const room = myRoom();
      if (!room) return;

      room.leave(token);
      socket.leave(roomId);
      socket.data.roomId = socket.data.token = undefined;
      if (room.isEmpty()) rooms.delete(roomId);
      else io.to(roomId).emit('waiting_for_opponent');
    });

    socket.on('disconnect', () => {
      if (socket.data.roomId) scheduleCleanup(socket.data.roomId);
    });

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
      if (!game.board.move(from, to)) socket.emit('action_error', 'Coup interdit.');
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
      if (room?.voteRematch(socket.data.token)) sendState(socket.data.roomId, room);
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
      sendState(socket.data.roomId, room);
    });
  });
}
