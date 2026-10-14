import { query } from './database';

export async function saveAvatar(userId: number, mime: string, data: Buffer) {
  await query(
    `INSERT INTO avatars (user_id, mime, data) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = NOW()`,
    [userId, mime, data],
  );
}

export async function deleteAvatar(userId: number) {
  await query('DELETE FROM avatars WHERE user_id = $1', [userId]);
}

export async function getAvatarByUsername(username: string): Promise<{ mime: string; data: Buffer } | null> {
  const [row] = await query<{ mime: string; data: Buffer }>(
    'SELECT a.mime, a.data FROM avatars a JOIN users u ON u.id = a.user_id WHERE u.username = $1',
    [username],
  );
  return row ?? null;
}
