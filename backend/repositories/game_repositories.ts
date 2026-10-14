import { query } from './database';
import { GameResult } from '../game/GameRoom';

export async function saveGame(result: GameResult) {
  await query(
    `INSERT INTO games (winner_id, loser_id, winner_crapettes, loser_crapettes, loser_cards_left, turns, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      result.winnerId, result.loserId, result.winnerCrapettes, result.loserCrapettes,
      result.loserCardsLeft, result.turns, result.startedAt,
    ],
  );
}

// Une partie vue par un joueur : son adversaire, le résultat et les chiffres de la partie.
export type PlayedGame = {
  id: number;
  won: boolean;
  opponent: string | null; // null si le compte adverse a été supprimé
  myCrapettes: number;
  opponentCrapettes: number;
  loserCardsLeft: number;
  turns: number;
  durationSeconds: number;
  endedAt: Date;
};

// Toutes les parties du joueur, de la plus récente à la plus ancienne.
export async function getUserGames(userId: number): Promise<PlayedGame[]> {
  return query<PlayedGame>(
    `SELECT g.id,
            g.winner_id = $1 AS won,
            u.username AS opponent,
            CASE WHEN g.winner_id = $1 THEN g.winner_crapettes ELSE g.loser_crapettes END AS "myCrapettes",
            CASE WHEN g.winner_id = $1 THEN g.loser_crapettes ELSE g.winner_crapettes END AS "opponentCrapettes",
            g.loser_cards_left AS "loserCardsLeft",
            g.turns,
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
export type LeaderboardRow = { username: string; games: number; wins: number; crapettes: number };

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  return query<LeaderboardRow>(
    `SELECT u.username,
            COUNT(*)::INTEGER AS games,
            COUNT(*) FILTER (WHERE g.winner_id = u.id)::INTEGER AS wins,
            SUM(CASE WHEN g.winner_id = u.id THEN g.winner_crapettes ELSE g.loser_crapettes END)::INTEGER AS crapettes
     FROM users u
     JOIN games g ON g.winner_id = u.id OR g.loser_id = u.id
     GROUP BY u.id`,
  );
}

// Duels les plus joués : chaque paire de joueurs avec le score de chacun.
export type Rivalry = { player1: string; player2: string; wins1: number; wins2: number };

export async function getRivalries(limit: number): Promise<Rivalry[]> {
  return query<Rivalry>(
    `SELECT u1.username AS player1, u2.username AS player2, d.wins1, d.games - d.wins1 AS wins2
     FROM (
       SELECT LEAST(winner_id, loser_id) AS id1,
              GREATEST(winner_id, loser_id) AS id2,
              COUNT(*)::INTEGER AS games,
              COUNT(*) FILTER (WHERE winner_id < loser_id)::INTEGER AS wins1
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
