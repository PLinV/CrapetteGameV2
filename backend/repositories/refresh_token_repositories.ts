import { query } from './database';

export async function saveRefreshToken(userId: number, tokenHash: string) {
  await query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
    [userId, tokenHash],
  );
}

// Supprime le token (usage unique) et renvoie son propriétaire s'il était encore valide.
export async function consumeRefreshToken(tokenHash: string): Promise<number | null> {
  const [row] = await query<{ user_id: number }>(
    'DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id',
    [tokenHash],
  );
  return row?.user_id ?? null;
}

export async function deleteRefreshToken(tokenHash: string) {
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

// Déconnecte l'utilisateur de tous ses appareils.
export async function deleteUserRefreshTokens(userId: number) {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}

export async function deleteExpiredRefreshTokens(): Promise<number> {
  const rows = await query('DELETE FROM refresh_tokens WHERE expires_at IS NULL OR expires_at < NOW() RETURNING id');
  return rows.length;
}
