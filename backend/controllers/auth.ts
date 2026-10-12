import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import {
  User, addUser, findUserByCredentials, getUserById, getUserByUsername,
} from '../repositories/user_repositories';
import { consumeRefreshToken, deleteRefreshToken, saveRefreshToken } from '../repositories/refresh_token_repositories';
import { createAccessToken, createRefreshToken, hashRefreshToken } from '../services/token';
import { IS_PROD } from '../config';

const ACCESS_COOKIE = {
  httpOnly: true, // invisible pour le JS côté client
  sameSite: 'strict' as const, // le front et l'API sont sur le même domaine
  secure: IS_PROD, // HTTPS uniquement en production
  path: '/', // aussi lu par le socket (/socket.io)
};
// Le refresh token n'est envoyé qu'aux routes de l'API qui en ont besoin.
const REFRESH_COOKIE = { ...ACCESS_COOKIE, path: '/api' };

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;

// Renvoie un message d'erreur si les identifiants sont mal formés.
function credentialsError(username: unknown, password: unknown, isRegister: boolean): string | null {
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return 'Tous les champs sont requis.';
  }
  if (!isRegister) return null;
  if (!USERNAME_REGEX.test(username)) return 'Pseudo : 3 à 20 caractères (lettres, chiffres, - et _).';
  if (password.length < 8 || password.length > 72) return 'Mot de passe : 8 à 72 caractères.';
  return null;
}

// Crée un access token (15 min) et un refresh token (7 jours) en cookies.
async function startSession(res: Response, user: User) {
  const refreshToken = createRefreshToken();
  await saveRefreshToken(user.id, hashRefreshToken(refreshToken));

  res.cookie('access_token', createAccessToken(user), { ...ACCESS_COOKIE, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...REFRESH_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function endSession(res: Response) {
  res.clearCookie('access_token', ACCESS_COOKIE);
  res.clearCookie('refresh_token', REFRESH_COOKIE);
}

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  const error = credentialsError(username, password, true);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const taken = () => res.status(409).json({ message: 'Pseudo déjà utilisé.' });
  if (await getUserByUsername(username)) {
    taken();
    return;
  }

  let user: User;
  try {
    user = await addUser(username, password);
  } catch (err) {
    // 23505 = contrainte UNIQUE : le pseudo a été pris entre-temps par une autre requête.
    if ((err as { code?: string }).code !== '23505') throw err;
    taken();
    return;
  }

  await startSession(res, user);
  res.json({ message: 'Inscription réussie.' });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  const user = credentialsError(username, password, false) ? null : await findUserByCredentials(username, password);
  if (!user) {
    res.status(401).json({ message: 'Pseudo ou mot de passe incorrect.' });
    return;
  }

  await startSession(res, user);
  res.json({ message: 'Connexion réussie.' });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ message: 'Utilisateur introuvable.' });
    return;
  }
  res.json({ username: user.username, isAdmin: user.isAdmin });
};

// Échange un refresh token valide contre une nouvelle paire de tokens (rotation).
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token;
  const userId = token ? await consumeRefreshToken(hashRefreshToken(token)) : null;
  const user = userId ? await getUserById(userId) : null;
  if (!user) {
    endSession(res);
    res.status(401).json({ message: 'Refresh token invalide ou expiré.' });
    return;
  }

  await startSession(res, user);
  res.json({ message: 'Tokens rafraîchis.' });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token;
  if (token) await deleteRefreshToken(hashRefreshToken(token));
  endSession(res);
  res.json({ message: 'Déconnexion réussie.' });
};
