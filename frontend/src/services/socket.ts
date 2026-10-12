import { io } from 'socket.io-client';

// Même domaine que la page. Connecté seulement pendant une partie (voir useGame),
// pour envoyer des cookies d'auth à jour.
export const socket = io({ autoConnect: false });
