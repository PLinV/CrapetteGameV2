import { io } from 'socket.io-client';

// Même domaine que la page. Connecté seulement pendant une partie (voir useGame),
// pour envoyer des cookies d'auth à jour : le serveur refuse les joueurs non connectés.
export const socket = io({ autoConnect: false });
