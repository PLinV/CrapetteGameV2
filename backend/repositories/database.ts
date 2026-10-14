import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool(config.db);
// Une connexion inactive qui tombe ne doit pas faire planter le serveur.
pool.on('error', (err) => console.error('[DB] Erreur de connexion :', err.message));

export async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );

    -- liens de réinitialisation de mot de passe, générés par un admin
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL
    );

    -- historique des parties terminées (un compte supprimé laisse ses parties, sans nom)
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      loser_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      winner_crapettes INTEGER NOT NULL,
      loser_crapettes INTEGER NOT NULL,
      loser_cards_left INTEGER NOT NULL,
      turns INTEGER NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS games_winner_idx ON games (winner_id);
    CREATE INDEX IF NOT EXISTS games_loser_idx ON games (loser_id);

    -- pour les bases créées avant l'ajout de ces colonnes
    ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
  `);
  console.log('[DB] tables prêtes');
}
