import { Request, Response } from 'express';
import { executeQuery } from '../database';
import {
  addUser,
  getUserById,
  getUserByUsername,
  userExist,
  verifLogin,
} from '../repositories/user_repositories';
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from '../services/token_service';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // access Token (Court : 15 minutes)
  res.cookie('access_token', accessToken, {
    httpOnly: true, // invisible pour le JS côté client
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, 
    path: '/',
  });

  // refresh Token (Long : 7 jours)
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    path: '/',
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', path: '/' });
  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', path: '/' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const estValide = await verifLogin(username, password);
    if (!estValide) {
      res.status(401).json({ confirm: false, message: "Pseudo ou mot de passe incorrect." });
      return;
    }

    const user = await getUserByUsername(username);
    if (!user) {
      res.status(404).json({ confirm: false, message: "Utilisateur introuvable." });
      return;
    }

    const accessToken = createAccessToken({ id: user.id, username: user.username });
    const refreshToken = createRefreshToken();

    const hashedRefresh = hashRefreshToken(refreshToken);
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token_hash) VALUES ($1, $2)",
      [user.id, hashedRefresh]
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({ confirm: true, message: "Connexion réussie." });
  } catch (error) {
    console.error("Erreur Login:", error);
    res.status(500).json({ confirm: false, message: "Erreur interne." });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ confirm: false, message: "Tous les champs sont requis." });
      return;
    }

    const existeDeja = await userExist(username, email);
    if (existeDeja) {
      res.status(409).json({ confirm: false, message: "Pseudo ou email déjà utilisé." });
      return;
    }

    const succesAjout = await addUser(username, email, password);
    if (!succesAjout) {
      res.status(500).json({ confirm: false, message: "Erreur lors de la création." });
      return;
    }

    const newUser = await getUserByUsername(username);
    
    const accessToken = createAccessToken({ id: newUser.id, username: newUser.username });
    const refreshToken = createRefreshToken();

    const hashedRefresh = hashRefreshToken(refreshToken);
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token_hash) VALUES ($1, $2)",
      [newUser.id, hashedRefresh]
    );

    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({ confirm: true, message: "Inscription réussie." });
  } catch (error) {
    console.error("Erreur Register:", error);
    res.status(500).json({ confirm: false, message: "Erreur interne." });
  }
};

export const verifyUser = async (req: any, res: Response): Promise<void> => {
  const infosUtilisateur = req.user; 
  const user = await getUserById(infosUtilisateur.id);

  if (!user) {
    res.status(404).json({ confirm: false, message: "Utilisateur introuvable." });
    return;
  }

  res.status(200).json({
    estConnecte: true,
    username: user.username,
    email: user.email
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      res.status(401).json({ confirm: false, message: "Refresh token manquant." });
      return;
    }

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const result = await executeQuery(
      "SELECT user_id FROM refresh_tokens WHERE token_hash = $1",
      [refreshTokenHash]
    );

    if (result.length === 0) {
      clearAuthCookies(res);
      res.status(401).json({ confirm: false, message: "Refresh token révoqué ou invalide." });
      return;
    }

    const userId = result[0].user_id;
    const user = await getUserById(userId);

    const newAccessToken = createAccessToken({ id: user.id, username: user.username });
    const newRefreshToken = createRefreshToken();
    const newHash = hashRefreshToken(newRefreshToken);

    await executeQuery("DELETE FROM refresh_tokens WHERE token_hash = $1", [refreshTokenHash]);
    await executeQuery(
      "INSERT INTO refresh_tokens (user_id, token_hash) VALUES ($1, $2)",
      [userId, newHash]
    );

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({ confirm: true, message: "Tokens rafraîchis avec succès." });
  } catch (error) {
    console.error("Erreur Refresh:", error);
    res.status(500).json({ confirm: false, message: "Erreur interne." });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refresh_token;

  if (refreshToken) {
    const hash = hashRefreshToken(refreshToken);
    await executeQuery("DELETE FROM refresh_tokens WHERE token_hash = $1", [hash]);
  }

  clearAuthCookies(res);
  res.status(200).json({ confirm: true, message: "Déconnexion réussie." });
};

export const logoutAll = async (req: any, res: Response): Promise<void> => {
  const userId = req.user?.id; 
  
  if (userId) {
    await executeQuery("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  }

  clearAuthCookies(res);
  res.status(200).json({ confirm: true, message: "Déconnecté de tous les appareils." });
};