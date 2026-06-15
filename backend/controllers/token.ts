import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { executeQuery } from '../database'; // Assure-toi que le chemin est correct

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret_access_temporaire';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret_refresh_temporaire';

// ==========================================
// 1. PARTIE "SERVICE" (Fonctions Utilitaires)
// ==========================================

export function createAccessToken(payload: object): string {
  return jwt.sign(payload, ACCESS_SECRET, { 
    algorithm: 'HS256',
    expiresIn: '15m' 
  });
}

export function verifyAccessToken(token: string): JwtPayload | string | null {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (error) {
    return null;
  }
}

export function createRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto
    .createHmac('sha256', REFRESH_SECRET)
    .update(token)
    .digest('hex');
}

/**
 * Route: POST /api/refresh
 * Reçoit l'ancien refresh token, vérifie en base, et renvoie un nouvel access token.
 */
export const refreshAccessTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // On attend le token dans le corps de la requête (JSON)
    const { token } = req.body;

    if (!token) {
      res.status(401).json({ error: "Refresh token manquant." });
      return;
    }

    // on hache le token reçu pour le comparer avec la base de données
    const hashedToken = hashRefreshToken(token);

    // on cherche ce hash dans la table refresh_tokens
    const result = await executeQuery(
      "SELECT user_id FROM refresh_tokens WHERE token_hash = $1",
      [hashedToken]
    );

    // si on ne trouve rien, c'est que le token est inventé, expiré ou révoqué
    if (result.length === 0) {
      res.status(403).json({ error: "Refresh token invalide ou révoqué. Veuillez vous reconnecter." });
      return;
    }

    const userId = result[0].user_id;

    // 3. Le token est valide ! On génère un nouvel Access Token (pass VIP de 15 min)
    const newAccessToken = createAccessToken({ id: userId });

    // 4. On renvoie le nouveau sésame au Frontend
    res.status(200).json({ accessToken: newAccessToken });

  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);
    res.status(500).json({ error: "Erreur serveur lors du rafraîchissement." });
  }
};