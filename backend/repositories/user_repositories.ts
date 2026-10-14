import bcrypt from 'bcryptjs';
import { config } from '../config';
import { query } from './database';

const BCRYPT_ROUNDS = 12;
// Hash comparé quand le pseudo n'existe pas, pour que la réponse prenne le même temps.
const DUMMY_HASH = bcrypt.hashSync('dummy', BCRYPT_ROUNDS);

// avatarVersion : date de la dernière photo de profil (null s'il n'y en a pas), pour l'URL de l'image.
export type User = { id: number; username: string; isAdmin: boolean; avatarVersion: string | null };

const USER_COLUMNS = `id, username, is_admin AS "isAdmin",
  (SELECT (EXTRACT(EPOCH FROM updated_at) * 1000)::BIGINT::TEXT FROM avatars WHERE user_id = users.id) AS "avatarVersion"`;

// URL publique de la photo de profil. La version change à chaque nouvelle photo :
// le navigateur peut garder l'image en cache indéfiniment.
export const avatarUrl = (user: Pick<User, 'username' | 'avatarVersion'>) =>
  user.avatarVersion ? `/api/avatars/${encodeURIComponent(user.username)}?v=${user.avatarVersion}` : null;

const hashPassword = (password: string) => bcrypt.hash(password + config.pepper, BCRYPT_ROUNDS);

export async function addUser(username: string, password: string): Promise<User> {
  const hash = await hashPassword(password);
  const [user] = await query<User>(
    `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
    [username, hash],
  );
  return user;
}

export async function updatePassword(userId: number, password: string) {
  await query('UPDATE users SET password = $1 WHERE id = $2', [await hashPassword(password), userId]);
}

export async function updateUsername(userId: number, username: string) {
  await query('UPDATE users SET username = $1 WHERE id = $2', [username, userId]);
}

export async function checkPassword(userId: number, password: string): Promise<boolean> {
  const [row] = await query<{ password: string }>('SELECT password FROM users WHERE id = $1', [userId]);
  return bcrypt.compare(password + config.pepper, row?.password ?? DUMMY_HASH);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [user] = await query<User>(`SELECT ${USER_COLUMNS} FROM users WHERE username = $1`, [username]);
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await query<User>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
  return user ?? null;
}

// Renvoie l'utilisateur si le mot de passe est bon, sinon null.
export async function findUserByCredentials(username: string, password: string): Promise<User | null> {
  const [row] = await query<User & { password: string }>(
    `SELECT ${USER_COLUMNS}, password FROM users WHERE username = $1`,
    [username],
  );
  const valid = await bcrypt.compare(password + config.pepper, row?.password ?? DUMMY_HASH);
  if (!row || !valid) return null;
  return { id: row.id, username: row.username, isAdmin: row.isAdmin, avatarVersion: row.avatarVersion };
}
