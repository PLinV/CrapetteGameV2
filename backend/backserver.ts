import 'dotenv/config'; // en premier : charge le .env avant les autres modules
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { createServer } from 'http';
import { Server } from 'socket.io';
import router from './routes/routes';
import { setupGameSockets } from './sockets/gameSocket';
import { initDB } from './repositories/database';
import { deleteExpiredRefreshTokens } from './repositories/refresh_token_repositories';

const PORT = process.env.PORT || 3000;
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: FRONT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(router);

// Express 5 transmet ici les erreurs levées par les contrôleurs async.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur interne.' });
});

const server = createServer(app);
setupGameSockets(new Server(server, { cors: { origin: FRONT_URL, credentials: true } }));

// Tous les jours à 3h : suppression des refresh tokens expirés.
cron.schedule('0 3 * * *', async () => {
  try {
    console.log(`[CRON] ${await deleteExpiredRefreshTokens()} refresh tokens expirés supprimés.`);
  } catch (error) {
    console.error('[CRON] Erreur lors du nettoyage :', error);
  }
});

initDB().then(() => {
  server.listen(PORT, () => console.log(`Serveur (HTTP + WebSockets) démarré sur http://localhost:${PORT}`));
});
