import { Server, Socket } from 'socket.io';
import { registerRoutes } from './socketRoutes';

export function setupGameSockets(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`[SOCKET] Joueur connecté : ${socket.id}`);

        // on branche toutes nos routes sur ce joueur
        registerRoutes(io, socket);

        // on peut garder la déconnexion ici ou la mettre dans le routeur plus tard
        socket.on('disconnect', () => {
            console.log(`[SOCKET] Joueur déconnecté : ${socket.id}`);
        });
    });
}