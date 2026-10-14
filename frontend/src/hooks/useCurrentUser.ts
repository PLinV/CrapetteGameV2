import { createContext, useContext } from 'react';

export type CurrentUser = { username: string; isAdmin: boolean };

// Joueur connecté, fourni par <RequireAuth> aux pages protégées.
export const CurrentUserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error('useCurrentUser doit être utilisé dans une page protégée par <RequireAuth>.');
  return user;
}
