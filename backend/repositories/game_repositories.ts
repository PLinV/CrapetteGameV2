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
