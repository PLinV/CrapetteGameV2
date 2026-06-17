// pour les futurs connexion multi
import { io } from 'socket.io-client';

// On exporte une unique instance de Socket
export const socket = io('http://localhost:3000', {
    autoConnect: true,
    credentials: true
});