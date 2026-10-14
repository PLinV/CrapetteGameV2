import { createContext, useContext } from 'react';

export type CurrentUser = { username: string; isAdmin: boolean; avatarUrl: string | null };

// Joueur connecté, fourni par <RequireAuth> aux pages protégées (modifiable depuis les paramètres).
export const CurrentUserContext = createContext<{ user: CurrentUser; setUser: (user: CurrentUser) => void } | null>(null);

function useCurrentUserContext() {
  const context = useContext(CurrentUserContext);
  if (!context) throw new Error('useCurrentUser doit être utilisé dans une page protégée par <RequireAuth>.');
  return context;
}

export const useCurrentUser = (): CurrentUser => useCurrentUserContext().user;
export const useSetCurrentUser = () => useCurrentUserContext().setUser;
