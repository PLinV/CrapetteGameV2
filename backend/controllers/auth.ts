import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import {
  User, addUser, findUserByCredentials, getUserById, getUserByUsername, updatePassword,
} from '../repositories/user_repositories';
import {
  consumeRefreshToken, deleteRefreshToken, deleteUserRefreshTokens, saveRefreshToken,
} from '../repositories/refresh_token_repositories';
import { consumePasswordReset, savePasswordReset } from '../repositories/password_reset_repositories';
import { getUserGames } from '../repositories/game_repositories';
import { computeStats } from '../services/stats';
import { createAccessToken, createRandomToken, hashToken } from '../services/token';
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
  return passwordError(password);
}

function passwordError(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return 'Mot de passe : 8 à 72 caractères.';
  }
  return null;
}

// Crée un access token (15 min) et un refresh token (7 jours) en cookies.
async function startSession(res: Response, user: User) {
  const refreshToken = createRandomToken();
  await saveRefreshToken(user.id, hashToken(refreshToken));

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

// Historique et statistiques du joueur connecté.
export const stats = async (req: AuthRequest, res: Response) => {
  res.json(computeStats(await getUserGames(req.user!.id)));
};

// Échange un refresh token valide contre une nouvelle paire de tokens (rotation).
export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token;
  const userId = token ? await consumeRefreshToken(hashToken(token)) : null;
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
  if (token) await deleteRefreshToken(hashToken(token));
  endSession(res);
  res.json({ message: 'Déconnexion réussie.' });
};

// Admin : crée un lien de réinitialisation (1 h, usage unique) pour un joueur qui a oublié son mot de passe.
// Le front en fait une URL que l'admin transmet au joueur.
export const createPasswordReset = async (req: Request, res: Response) => {
  const { username } = req.body ?? {};
  const user = typeof username === 'string' ? await getUserByUsername(username) : null;
  if (!user) {
    res.status(404).json({ message: 'Joueur introuvable.' });
    return;
  }

  const token = createRandomToken();
  await savePasswordReset(user.id, hashToken(token));
  res.json({ username: user.username, token });
};

// Le joueur choisit un nouveau mot de passe grâce au lien : ses anciennes sessions sont fermées et il est connecté.
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  const error = passwordError(password);
  if (error) {
    res.status(400).json({ message: error });
    return;
  }

  const userId = typeof token === 'string' && token ? await consumePasswordReset(hashToken(token)) : null;
  const user = userId ? await getUserById(userId) : null;
  if (!user) {
    res.status(400).json({ message: 'Lien invalide ou expiré : demandez-en un nouveau à l\'administrateur.' });
    return;
  }

  await updatePassword(user.id, password);
  await deleteUserRefreshTokens(user.id);
  await startSession(res, user);
  res.json({ message: 'Mot de passe modifié.' });
};
