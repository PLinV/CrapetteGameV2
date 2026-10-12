import bcrypt from 'bcryptjs';
import { config } from '../config';
import { query } from './database';

const BCRYPT_ROUNDS = 12;
// Hash comparé quand le pseudo n'existe pas, pour que la réponse prenne le même temps.
const DUMMY_HASH = bcrypt.hashSync('dummy', BCRYPT_ROUNDS);

export type User = { id: number; username: string; isAdmin: boolean };

const USER_COLUMNS = 'id, username, is_admin AS "isAdmin"';

export async function addUser(username: string, password: string): Promise<User> {
  const hash = await bcrypt.hash(password + config.pepper, BCRYPT_ROUNDS);
  const [user] = await query<User>(
    `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING ${USER_COLUMNS}`,
    [username, hash],
  );
  return user;
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
  return { id: row.id, username: row.username, isAdmin: row.isAdmin };
}
