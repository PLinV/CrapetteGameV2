import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import { checkPassword, getUserById, updatePassword, updateUsername } from '../repositories/user_repositories';
import { deleteUserRefreshTokens } from '../repositories/refresh_token_repositories';
import { deleteAvatar, getAvatarByUsername, saveAvatar } from '../repositories/avatar_repositories';
import { passwordError, startSession, usernameError } from './auth';
import { findPausedGame } from '../sockets/gameSocket';

// Formats acceptés, reconnus à leurs premiers octets (et non au type annoncé par le navigateur) :
// impossible de faire passer un autre fichier (HTML, SVG avec script...) pour une image.
const IMAGE_SIGNATURES: { mime: string; matches: (data: Buffer) => boolean }[] = [
  { mime: 'image/png', matches: (d) => d.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/jpeg', matches: (d) => d[0] === 0xff && d[1] === 0xd8 && d[2] === 0xff },
  { mime: 'image/webp', matches: (d) => d.toString('ascii', 0, 4) === 'RIFF' && d.toString('ascii', 8, 12) === 'WEBP' },
];

export const changeUsername = async (req: AuthRequest, res: Response) => {
  const { username } = req.body ?? {};
  const error = usernameError(username);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  try {
    await updateUsername(req.user!.id, username);
  } catch (err) {
    // 23505 = contrainte UNIQUE : pseudo déjà pris.
    if ((err as { code?: string }).code !== '23505') throw err;
    res.status(409).json({ message: 'Pseudo déjà utilisé.' });
    return;
  }
  res.json({ username });
};

// Change le mot de passe : les autres appareils sont déconnectés, celui-ci reste connecté.
export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body ?? {};
  const error = passwordError(newPassword);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  const user = await getUserById(req.user!.id);
  if (!user || typeof currentPassword !== 'string' || !(await checkPassword(user.id, currentPassword))) {
    res.status(403).json({ message: 'Mot de passe actuel incorrect.' });
    return;
  }

  await updatePassword(user.id, newPassword);
  await deleteUserRefreshTokens(user.id);
  await startSession(res, user);
  res.json({ message: 'Mot de passe modifié.' });
};

// Corps de la requête : l'image brute (voir la route, qui limite sa taille).
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  const data = Buffer.isBuffer(req.body) ? req.body : null;
  const format = data && IMAGE_SIGNATURES.find((signature) => signature.matches(data));
  if (!data || !format) {
    res.status(400).json({ message: 'Image invalide : PNG, JPEG ou WebP uniquement.' });
    return;
  }

  await saveAvatar(req.user!.id, format.mime, data);
  res.json({ message: 'Photo de profil enregistrée.' });
};

export const removeAvatar = async (req: AuthRequest, res: Response) => {
  await deleteAvatar(req.user!.id);
  res.json({ message: 'Photo de profil supprimée.' });
};

// Photos de profil publiques, mises en cache : l'URL change à chaque nouvelle photo (?v=...).
export const getAvatar = async (req: Request, res: Response) => {
  const avatar = await getAvatarByUsername(String(req.params.username));
  if (!avatar) {
    res.status(404).json({ message: 'Pas de photo de profil.' });
    return;
  }
  res.set({ 'Content-Type': avatar.mime, 'Cache-Control': 'public, max-age=31536000, immutable' });
  res.send(avatar.data);
};

// Partie que le joueur a quittée et peut encore reprendre avant de perdre par forfait.
export const pausedGame = (req: AuthRequest, res: Response) => {
  res.json(findPausedGame(req.user!.id));
};
