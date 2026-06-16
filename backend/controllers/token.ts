import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { getUserById } from '../repositories/user_repositories';
import { executeQuery } from '../repositories/database'; 

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret_access_temporaire';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret_refresh_temporaire';

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

export const refreshAccessTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token manquant dans les cookies." });
      return;
    }

    const hashedToken = hashRefreshToken(refreshToken);

    const result = await executeQuery(
      "SELECT user_id FROM refresh_tokens WHERE token_hash = $1",
      [hashedToken]
    );

    if (result.length === 0) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      res.status(403).json({ error: "Refresh token invalide ou révoqué. Veuillez vous reconnecter." });
      return;
    }

    const userId = result[0].user_id;

    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ error: "Utilisateur introuvable." });
      return;
    }

    const newAccessToken = createAccessToken({ 
      id: user.id, 
      username: user.username 
    });

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.status(200).json({ success: true, message: "access token rafraîchi avec succès." });

  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);
    res.status(500).json({ error: "Erreur serveur lors du rafraîchissement." });
  }
};