import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import {
  User, addUser, findUserByCredentials, getUserById, getUserByUsername,
} from '../repositories/user_repositories';
import { consumeRefreshToken, deleteRefreshToken, saveRefreshToken } from '../repositories/refresh_token_repositories';
import { createAccessToken, createRefreshToken, hashRefreshToken } from '../services/token';

const COOKIE_OPTIONS = {
  httpOnly: true, // invisible pour le JS côté client
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// Crée un access token (15 min) et un refresh token (7 jours) en cookies.
async function startSession(res: Response, user: User) {
  const refreshToken = createRefreshToken();
  await saveRefreshToken(user.id, hashRefreshToken(refreshToken));

  res.cookie('access_token', createAccessToken(user), { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function endSession(res: Response) {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
}

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Tous les champs sont requis.' });
    return;
  }
  if (await getUserByUsername(username)) {
    res.status(409).json({ message: 'Pseudo déjà utilisé.' });
    return;
  }

  await startSession(res, await addUser(username, password));
  res.json({ message: 'Inscription réussie.' });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await findUserByCredentials(username, password);
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
