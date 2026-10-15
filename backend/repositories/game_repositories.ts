import { query } from './database';
import { GameResult } from '../game/GameRoom';

export async function saveGame(result: GameResult) {
  await query(
    `INSERT INTO games (winner_id, loser_id, winner_crapettes, loser_crapettes, loser_cards_left, turns, started_at, forfeit, draw)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      result.winnerId, result.loserId, result.winnerCrapettes, result.loserCrapettes,
      result.loserCardsLeft, result.turns, result.startedAt, result.forfeit, result.draw,
    ],
  );
}

// Une partie vue par un joueur : son adversaire, le résultat et les chiffres de la partie.
export type PlayedGame = {
  id: number;
  won: boolean;
  draw: boolean; // match nul (won est alors faux)
  opponent: string | null; // null si le compte adverse a été supprimé
  myCrapettes: number;
  opponentCrapettes: number;
  loserCardsLeft: number;
  turns: number;
  forfeit: boolean; // gagnée parce que le perdant n'est pas revenu à temps
  durationSeconds: number;
  endedAt: Date;
};

// Toutes les parties du joueur, de la plus récente à la plus ancienne.
export async function getUserGames(userId: number): Promise<PlayedGame[]> {
  return query<PlayedGame>(
    `SELECT g.id,
            g.winner_id = $1 AND NOT g.draw AS won,
            g.draw,
            u.username AS opponent,
            CASE WHEN g.winner_id = $1 THEN g.winner_crapettes ELSE g.loser_crapettes END AS "myCrapettes",
            CASE WHEN g.winner_id = $1 THEN g.loser_crapettes ELSE g.winner_crapettes END AS "opponentCrapettes",
            g.loser_cards_left AS "loserCardsLeft",
            g.turns,
            g.forfeit,
            EXTRACT(EPOCH FROM g.ended_at - g.started_at)::INTEGER AS "durationSeconds",
            g.ended_at AS "endedAt"
     FROM games g
     LEFT JOIN users u ON u.id = CASE WHEN g.winner_id = $1 THEN g.loser_id ELSE g.winner_id END
     WHERE g.winner_id = $1 OR g.loser_id = $1
     ORDER BY g.ended_at DESC, g.id DESC`,
    [userId],
  );
}

// Bilan de chaque joueur ayant au moins une partie terminée.
export type LeaderboardRow = { username: string; avatarVersion: string | null; games: number; wins: number; draws: number; crapettes: number };

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  return query<LeaderboardRow>(
    `SELECT u.username,
            (SELECT (EXTRACT(EPOCH FROM a.updated_at) * 1000)::BIGINT::TEXT FROM avatars a WHERE a.user_id = u.id) AS "avatarVersion",
            COUNT(*)::INTEGER AS games,
            COUNT(*) FILTER (WHERE g.winner_id = u.id AND NOT g.draw)::INTEGER AS wins,
            COUNT(*) FILTER (WHERE g.draw)::INTEGER AS draws,
            SUM(CASE WHEN g.winner_id = u.id THEN g.winner_crapettes ELSE g.loser_crapettes END)::INTEGER AS crapettes
     FROM users u
     JOIN games g ON g.winner_id = u.id OR g.loser_id = u.id
     GROUP BY u.id`,
  );
}

// Duels les plus joués : chaque paire de joueurs avec le score de chacun et les nuls.
export type Rivalry = { player1: string; player2: string; wins1: number; wins2: number; draws: number };

export async function getRivalries(limit: number): Promise<Rivalry[]> {
  return query<Rivalry>(
    `SELECT u1.username AS player1, u2.username AS player2, d.wins1, d.games - d.wins1 - d.draws AS wins2, d.draws
     FROM (
       SELECT LEAST(winner_id, loser_id) AS id1,
              GREATEST(winner_id, loser_id) AS id2,
              COUNT(*)::INTEGER AS games,
              COUNT(*) FILTER (WHERE winner_id < loser_id AND NOT draw)::INTEGER AS wins1,
              COUNT(*) FILTER (WHERE draw)::INTEGER AS draws
       FROM games
       WHERE winner_id IS NOT NULL AND loser_id IS NOT NULL
       GROUP BY 1, 2
     ) d
     JOIN users u1 ON u1.id = d.id1
     JOIN users u2 ON u2.id = d.id2
     ORDER BY d.games DESC, u1.username, u2.username
     LIMIT $1`,
    [limit],
  );
}
