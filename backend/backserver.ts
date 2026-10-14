import { config, IS_PROD } from './config'; // en premier : charge le .env
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { createServer } from 'http';
import { Server } from 'socket.io';
import router from './routes/routes';
import { setupGameSockets } from './sockets/gameSocket';
import { initDB } from './repositories/database';
import { deleteExpiredRefreshTokens } from './repositories/refresh_token_repositories';
import { deleteExpiredPasswordResets } from './repositories/password_reset_repositories';

const app = express();
// En production, le serveur est derrière un reverse proxy (Traefik) : l'IP réelle est dans X-Forwarded-For.
if (IS_PROD) app.set('trust proxy', 1);

app.use(helmet()); // en-têtes de sécurité (CSP, anti-clickjacking, etc.)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', router);
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Route inconnue.' });
});

// En production, Express sert aussi le frontend : un seul domaine, pas de CORS.
// En dev, c'est Vite qui sert le front et redirige /api et /socket.io ici (voir vite.config.ts).
if (IS_PROD) {
  app.use(express.static(config.frontDist));
  // Toutes les autres URL renvoient l'appli React, qui gère ses propres routes.
  app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: config.frontDist }));
}

// Express 5 transmet ici les erreurs levées par les contrôleurs async.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur interne.' });
});

const server = createServer(app);
setupGameSockets(new Server(server, { maxHttpBufferSize: 10_000 }));

// Tous les jours à 3h : suppression des refresh tokens et liens de réinitialisation expirés.
cron.schedule('0 3 * * *', async () => {
  try {
    console.log(`[CRON] ${await deleteExpiredRefreshTokens()} refresh tokens expirés supprimés.`);
    console.log(`[CRON] ${await deleteExpiredPasswordResets()} liens de réinitialisation expirés supprimés.`);
  } catch (error) {
    console.error('[CRON] Erreur lors du nettoyage :', error);
  }
});

initDB().then(() => {
  server.listen(config.port, () => console.log(`Serveur (HTTP + WebSockets) démarré sur le port ${config.port}`));
});
