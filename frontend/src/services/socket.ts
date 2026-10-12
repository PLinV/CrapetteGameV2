import { io } from 'socket.io-client';
import { API_URL } from './api';

// Connecté seulement pendant une partie (voir useGame), pour envoyer des cookies d'auth à jour.
export const socket = io(API_URL, { withCredentials: true, autoConnect: false });
