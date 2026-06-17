import { Server, Socket } from 'socket.io';
import { 
    handleJoinRoom, 
    handlePassTurn, 
    handleCardDragging, 
    handleCardDrop, 
    handleSyncCard,
    handleDisconnect // <-- NOUVEL IMPORT
} from '../controllers/gameController';

export function registerRoutes(io: Server, socket: Socket) {
    
    socket.on('join_game_room', (roomId: string) => handleJoinRoom(io, socket, roomId));
    socket.on('pass_turn', (roomId: string) => handlePassTurn(io, socket, roomId));

    socket.on('card_dragging', (data) => handleCardDragging(socket, data));
    socket.on('card_drop', (roomId: string) => handleCardDrop(socket, roomId));
    socket.on('sync_card', (data) => handleSyncCard(socket, data));

    socket.on('disconnect', () => handleDisconnect(io, socket));
}