// backend/src/sockets/socketRoutes.ts
import { Server, Socket } from 'socket.io';
import { 
    handleJoinRoom, handlePassTurn, handleDisconnect,
    handleCardDragging, handleCardPointerDown, handleCardDrop, handleDrawCard
} from '../controllers/gameController';

export function registerRoutes(io: Server, socket: Socket) {
    socket.on('join_game_room', (roomId: string) => handleJoinRoom(io, socket, roomId));
    socket.on('pass_turn', (roomId: string) => handlePassTurn(io, socket, roomId));
    socket.on('disconnect', () => handleDisconnect(io, socket));

    socket.on('card_dragging', (data) => handleCardDragging(socket, data));
    
    // NOUVELLES ROUTES :
    socket.on('draw_card', (roomId: string) => handleDrawCard(io, socket, roomId));
    socket.on('card_pointer_down', (data) => handleCardPointerDown(socket, data));
    socket.on('card_drop_zone', (data) => handleCardDrop(io, socket, data));
}