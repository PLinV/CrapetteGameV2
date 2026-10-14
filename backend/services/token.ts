import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { User } from '../repositories/user_repositories';

// Le rôle admin n'est pas mis dans le token : il est relu en base à chaque vérification.
type TokenUser = Pick<User, 'id' | 'username'>;

export function createAccessToken(user: TokenUser): string {
  return jwt.sign({ id: user.id, username: user.username }, config.accessTokenSecret, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

export function verifyAccessToken(token: string): TokenUser | null {
  try {
    return jwt.verify(token, config.accessTokenSecret, { algorithms: ['HS256'] }) as TokenUser;
  } catch {
    return null;
  }
}

// Refresh tokens et liens de réinitialisation : valeurs aléatoires dont on ne stocke que le hash en base.
export function createRandomToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', config.refreshTokenSecret).update(token).digest('hex');
}
