import { query } from './database';

// Un seul lien actif par utilisateur : en générer un nouveau remplace l'ancien.
export async function savePasswordReset(userId: number, tokenHash: string) {
  await query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')
     ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at`,
    [userId, tokenHash],
  );
}

// Supprime le lien (usage unique) et renvoie son utilisateur s'il était encore valide.
export async function consumePasswordReset(tokenHash: string): Promise<number | null> {
  const [row] = await query<{ user_id: number }>(
    'DELETE FROM password_resets WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id',
    [tokenHash],
  );
  return row?.user_id ?? null;
}

export async function deleteExpiredPasswordResets(): Promise<number> {
  const rows = await query('DELETE FROM password_resets WHERE expires_at < NOW() RETURNING id');
  return rows.length;
}
