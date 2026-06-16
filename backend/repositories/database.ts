import { Pool } from 'pg';
import dotenv from 'dotenv';

// Charge les variables du fichier .env
dotenv.config();

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host: 'localhost', // Le Docker tourne sur ta machine locale
  port: 5432,
});

// Fonction pour initialiser la DB au démarrage du serveur
export async function initDB() {
  const client = await pool.connect();
  try {
    console.log("connecté à la DB ");
    
    // Création de la table avec usernameet password
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log("table 'users' vérifiée/créée.");

    await client.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log("table 'refresh_tokens' vérifiée/créée.");

  } catch (error) {
    console.error("erreur lors de l'initialisation de la DB :", error);
  } finally {
    client.release();
  }
}

// Fonction utilitaire pour exécuter des requêtes SQL facilement
export async function executeQuery(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows; // Avec Node/pg, on renvoie directement le tableau des résultats
  } finally {
    client.release(); 
  }
}

export { pool };