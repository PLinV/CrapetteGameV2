import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../repositories/user_repositories';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret_access_temporaire';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret_refresh_temporaire';

export function createAccessToken(user: User): string {
  return jwt.sign({ id: user.id, username: user.username }, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}

export function verifyAccessToken(token: string): User | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as User;
  } catch {
    return null;
  }
}

// Le refresh token est une valeur aléatoire : on ne stocke que son hash en base.
export function createRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHmac('sha256', REFRESH_SECRET).update(token).digest('hex');
}
