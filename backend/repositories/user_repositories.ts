import bcrypt from 'bcrypt';
import { query } from './database';

const PEPPER = process.env.PEPPER || 'CrapetteSecretPepper';

export type User = { id: number; username: string };

export async function addUser(username: string, password: string): Promise<User> {
  const hash = await bcrypt.hash(password + PEPPER, 10);
  const [user] = await query<User>(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
    [username, hash],
  );
  return user;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [user] = await query<User>('SELECT id, username FROM users WHERE username = $1', [username]);
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await query<User>('SELECT id, username FROM users WHERE id = $1', [id]);
  return user ?? null;
}

// Renvoie l'utilisateur si le mot de passe est bon, sinon null.
export async function findUserByCredentials(username: string, password: string): Promise<User | null> {
  const [row] = await query<User & { password: string }>(
    'SELECT id, username, password FROM users WHERE username = $1',
    [username],
  );
  if (!row || !(await bcrypt.compare(password + PEPPER, row.password))) return null;
  return { id: row.id, username: row.username };
}
