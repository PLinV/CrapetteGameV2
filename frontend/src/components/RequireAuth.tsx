import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';
import { CurrentUserContext, type CurrentUser } from '../hooks/useCurrentUser';

// Protège les pages réservées aux joueurs connectés. Sinon, renvoie vers la connexion,
// qui ramènera ensuite à la page demandée (ex : le lien d'une table envoyé par un ami).
export default function RequireAuth() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/me')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((me) => {
        if (cancelled) return;
        if (me) setUser({ username: me.username, isAdmin: !!me.isAdmin });
        else navigate('/login', { replace: true, state: { from: pathname } });
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, pathname]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-amber-500 animate-pulse font-bold tracking-widest uppercase">Vérification...</div>
      </div>
    );
  }

  return (
    <CurrentUserContext.Provider value={user}>
      <Outlet />
    </CurrentUserContext.Provider>
  );
}
