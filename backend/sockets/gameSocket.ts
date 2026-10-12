import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom';
import { PlayerNumber } from '../../constant/plateau';
import { verifyAccessToken } from '../services/token';
import { getUserById } from '../repositories/user_repositories';

const rooms = new Map<string, GameRoom>();

type AdminAction = 'nearly_win' | 'give_turn' | 'force_win' | 'new_game';

// Lit un cookie dans l'en-tête de la connexion socket.
const readCookie = (header: string | undefined, name: string) =>
  header?.split('; ').find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

export function setupGameSockets(io: Server) {
  const sendState = (roomId: string, room: GameRoom) => io.to(roomId).emit('game_state', room.state());

  // À la connexion, on regarde si le joueur est connecté à un compte admin (cookie d'auth).
  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, 'access_token');
    const tokenUser = token ? verifyAccessToken(decodeURIComponent(token)) : null;
    const user = tokenUser ? await getUserById(tokenUser.id).catch(() => null) : null;
    socket.data.isAdmin = !!user?.isAdmin;
    next();
  });

  io.on('connection', (socket: Socket) => {
    // Le plateau de la partie du socket, uniquement si c'est à lui de jouer et que la partie n'est pas finie.
    const myTurnBoard = () => {
      const room = rooms.get(socket.data.roomId);
      const board = room?.board;
      if (!room || !board || board.winner || room.playerNumber(socket.data.userId) !== board.activePlayer) return null;
      return { room, board };
    };

    socket.on('join_room', ({ roomId, userId }: { roomId: string; userId: string }) => {
      if (!roomId || !userId) return;
      const room = rooms.get(roomId) ?? new GameRoom();
      rooms.set(roomId, room);

      if (!room.join(userId)) {
        socket.emit('room_error', 'La table est déjà pleine !');
        return;
      }
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;

      if (room.board) sendState(roomId, room);
      else socket.emit('waiting_for_opponent');
    });

    socket.on('leave_room', () => {
      const { roomId, userId } = socket.data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.leave(userId);
      socket.leave(roomId);
      socket.data.roomId = socket.data.userId = undefined;
      if (room.isEmpty()) rooms.delete(roomId);
      else io.to(roomId).emit('waiting_for_opponent');
    });

    socket.on('draw_card', () => {
      const game = myTurnBoard();
      if (!game) return;
      if (!game.board.draw()) socket.emit('action_error', 'Vous ne pouvez pas piocher maintenant.');
      sendState(socket.data.roomId, game.room);
    });

    socket.on('move_card', ({ from, to }: { from: string; to: string }) => {
      const game = myTurnBoard();
      if (!game) return;
      if (!game.board.move(from, to)) socket.emit('action_error', 'Coup interdit.');
      sendState(socket.data.roomId, game.room);
    });

    // Seul l'adversaire du joueur actif peut crier « Crapette ! ».
    socket.on('call_crapette', () => {
      const room = rooms.get(socket.data.roomId);
      const board = room?.board;
      const caller = room?.playerNumber(socket.data.userId);
      if (!room || !board || !caller || caller === board.activePlayer) return;

      if (!board.callCrapette()) {
        socket.emit('action_error', "Pas de faute : la Crapette est refusée.");
        return;
      }
      io.to(socket.data.roomId).emit('crapette_called', socket.data.userId);
      sendState(socket.data.roomId, room);
    });

    socket.on('play_again', () => {
      const room = rooms.get(socket.data.roomId);
      if (room?.voteRematch(socket.data.userId)) sendState(socket.data.roomId, room);
    });

    // Outils de test réservés aux comptes admin. `target` : 'me' ou 'opponent'.
    socket.on('admin_action', ({ action, target }: { action: AdminAction; target: 'me' | 'opponent' }) => {
      const room = rooms.get(socket.data.roomId);
      const board = room?.board;
      const me = room?.playerNumber(socket.data.userId);
      if (!socket.data.isAdmin || !room || !board || !me) return;

      const player = (target === 'me' ? me : 3 - me) as PlayerNumber;
      if (action === 'nearly_win') board.adminNearlyWin(player);
      else if (action === 'give_turn') board.adminGiveTurn(player);
      else if (action === 'force_win') board.adminForceWin(player);
      else if (action === 'new_game') room.newGame();
      sendState(socket.data.roomId, room);
    });

    socket.on('pass_turn', () => {
      const game = myTurnBoard();
      if (!game) return;
      game.board.passTurn();
      sendState(socket.data.roomId, game.room);
    });
  });
}
