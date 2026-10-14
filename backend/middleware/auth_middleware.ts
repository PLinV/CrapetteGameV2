import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token';
import { getUserById } from '../repositories/user_repositories';

export interface AuthRequest extends Request {
  user?: { id: number; username: string };
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

// À placer après requireAuth. Le rôle est relu en base : un admin rétrogradé perd l'accès immédiatement.
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserById(req.user!.id);
  if (!user?.isAdmin) {
    res.status(403).json({ message: 'Réservé aux administrateurs.' });
    return;
  }
  next();
};
