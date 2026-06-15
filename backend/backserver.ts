import express, { Request, Response } from 'express';
import cors from 'cors';
import { initDB } from './repositories/database';

const app = express();
const PORT = process.env.PORT || 3000;

// middleware pour cors autorise l'url suivant de faire des requéte 
app.use(cors({ origin: 'http://localhost:5173' })); 

// permet de lire les corps de requêtes au format JSON
app.use(express.json());


app.get('/', (req: Request, res: Response) => {
    res.send('Le serveur backend est bien lancé');
});

app.get('/api/test', (req: Request, res: Response) => {
    res.json({ 
        success: true, 
        message: 'La communication entre React et Express fonctionne' 
    });
});

initDB();

app.listen(PORT, () => {
    console.log(`serveur démarré avec succès sur http://localhost:${PORT}`);
});