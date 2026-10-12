import 'dotenv/config';
import path from 'path';

// Toute la configuration du serveur, lue depuis les variables d'environnement (.env).
export const IS_PROD = process.env.NODE_ENV === 'production';

// En production, un secret manquant arrête le serveur : on ne tourne jamais avec une valeur par défaut connue.
function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (IS_PROD) throw new Error(`Variable d'environnement manquante : ${name}`);
  return devFallback;
}

export const config = {
  port: Number(process.env.PORT) || 3000,

  accessTokenSecret: secret('ACCESS_TOKEN_SECRET', 'dev_access_secret'),
  refreshTokenSecret: secret('REFRESH_TOKEN_SECRET', 'dev_refresh_secret'),
  // Ajouté aux mots de passe avant hachage. Le changer rend les anciens mots de passe invalides.
  pepper: secret('PEPPER', 'CrapetteSecretPepper'),

  db: {
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
  },

  // Build du frontend, servi par Express en production (le serveur est lancé depuis backend/).
  frontDist: process.env.FRONT_DIST || path.resolve(process.cwd(), '../frontend/dist'),
};
