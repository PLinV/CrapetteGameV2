import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token';
import { User } from '../repositories/user_repositories';

export interface AuthRequest extends Request {
  user?: User;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const user = req.cookies.access_token && verifyAccessToken(req.cookies.access_token);
  if (!user) {
    // 401 : le front tente alors un /refresh
    res.status(401).json({ message: 'Token invalide ou expiré.' });
    return;
  }
  req.user = user;
  next();
};
