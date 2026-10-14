import { Response } from 'express';
import { AuthRequest } from '../middleware/auth_middleware';
import { getLeaderboardRows, getRivalries, getUserGames } from '../repositories/game_repositories';
import { computeLeaderboard, computeStats } from '../services/stats';

const RIVALRIES = 10;

// Historique et statistiques du joueur connecté.
export const stats = async (req: AuthRequest, res: Response) => {
  res.json(computeStats(await getUserGames(req.user!.id)));
};

// Classement général de tous les joueurs et duels les plus joués.
export const leaderboard = async (_req: AuthRequest, res: Response) => {
  const [rows, rivalries] = await Promise.all([getLeaderboardRows(), getRivalries(RIVALRIES)]);
  res.json({ players: computeLeaderboard(rows), rivalries });
};
