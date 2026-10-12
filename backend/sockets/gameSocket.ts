import { Server, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom';

const rooms = new Map<string, GameRoom>();

export function setupGameSockets(io: Server) {
  const sendState = (roomId: string, room: GameRoom) => io.to(roomId).emit('game_state', room.state());

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
      socket.data = { roomId, userId };

      if (room.board) sendState(roomId, room);
      else socket.emit('waiting_for_opponent');
    });

    socket.on('leave_room', () => {
      const { roomId, userId } = socket.data;
      const room = rooms.get(roomId);
      if (!room) return;

      room.leave(userId);
      socket.leave(roomId);
      socket.data = {};
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

    socket.on('pass_turn', () => {
      const game = myTurnBoard();
      if (!game) return;
      game.board.passTurn();
      sendState(socket.data.roomId, game.room);
    });
  });
}
