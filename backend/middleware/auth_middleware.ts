import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../controllers/token'; // Adapte le chemin selon tes dossiers

// on étend l'objet Request pour pouvoir y stocker les infos du joueur
export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // on cherche le token directement dans les cookies
  const token = req.cookies.access_token;

  // si le cookie n'est pas là
  if (!token) {
    res.status(401).json({ error: "Accès refusé. Aucun token fourni dans les cookies." });
    return;
  }

  // on vérifie la signature mathématique
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    // si expiré ou trafiqué -> 401. C'est le signal pour que le Front appelle /refresh !
    res.status(401).json({ error: "Token invalide ou expiré.", code: "TOKEN_EXPIRED" });
    return;
  }

  // tout est bon, on attache l'ID du joueur à la requête pour les prochains contrôleurs
  req.user = decoded;
  next(); 
};