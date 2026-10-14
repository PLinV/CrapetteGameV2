import { Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import { User, getUserById } from '../repositories/user_repositories';

// Page personnalisée (/pour-anna), réservée à ces comptes et aux admins.
// Le contenu n'est envoyé qu'à eux : il n'est pas écrit dans le code du site, téléchargé par tous.
const ALLOWED_USERNAMES = ['Anna', 'Paulin'];

const FOR_ANNA = {
  message: "2 ans de relation c'est beau je tuberlupe !!",
  since: '2024-10-14T08:00:00+02:00', // 14 octobre 2024 à 8h00, heure de Paris
};

export const canSeeForAnna = (user: Pick<User, 'username' | 'isAdmin'>) =>
  user.isAdmin || ALLOWED_USERNAMES.includes(user.username);

export const forAnna = async (req: AuthRequest, res: Response) => {
  const user = await getUserById(req.user!.id);
  if (!user || !canSeeForAnna(user)) {
    res.status(403).json({ message: 'Page privée.' });
    return;
  }
  res.json(FOR_ANNA);
};
