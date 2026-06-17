import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDB } from './repositories/database';
import { createServer } from 'http'; 
import { Server } from 'socket.io';
import cron from 'node-cron';
import { setupGameSockets } from './sockets/gameSocket';

import { executeQuery } from './repositories/database';
import router from './routes/routes';

const app = express();
const PORT = process.env.PORT || 3000;

const server = createServer(app); 

// on branche socket.io sur ce serveur HTTP
const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', methods: ["GET", "POST"], credentials: true }
});

setupGameSockets(io);

// config http
app.use(cors({ 
    origin: 'http://localhost:5173',
    credentials: true
})); 
app.use(express.json());
app.use(cookieParser()); 

app.use('/', router);

app.get('/', (req: Request, res: Response) => {
    res.send('Le serveur backend est bien lancé');
});

app.get('/api/test', (req: Request, res: Response) => {
    res.json({ success: true, message: 'La communication HTTP fonctionne' });
});

// config socket.io 
io.on('connection', (socket) => {
    console.log(`[SOCKET] Nouveau joueur connecté : ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[SOCKET] Joueur déconnecté : ${socket.id}`);
    });
});

initDB();
cron.schedule('0 3 * * *', async () => {
    try {
        console.log("[CRON] Début du nettoyage des vieux tokens...");
        const result = await executeQuery("DELETE FROM refresh_tokens WHERE expires_at < NOW() RETURNING id");
        console.log(`[CRON] Nettoyage terminé. ${result.length} tokens supprimés.`);
    } catch (error) {
        console.error("[CRON] Erreur lors du nettoyage :", error);
    }
});
server.listen(PORT, () => {
    console.log(`serveur mixte (HTTP + WebSockets) démarré sur http://localhost:${PORT}`);
});