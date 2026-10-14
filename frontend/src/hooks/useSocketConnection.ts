import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import { fetchWithAuth } from '../services/api';

// Connecte le socket tant que la page est affichée. `onConnect` est appelé à chaque connexion,
// y compris après une coupure réseau. `returnTo` : page où revenir si la session a expiré.
export function useSocketConnection(onConnect: () => void, returnTo: string) {
  const navigate = useNavigate();
  const onConnectRef = useRef(onConnect);
  useEffect(() => {
    onConnectRef.current = onConnect;
  });

  useEffect(() => {
    let cancelled = false;
    let refreshed = false;
    const handleConnect = () => {
      refreshed = false;
      onConnectRef.current();
    };

    const toLogin = () => navigate('/login', { replace: true, state: { from: returnTo } });
    // Le serveur refuse les sockets sans compte connecté. L'access token (15 min) a pu expirer
    // avant une reconnexion : on le rafraîchit une fois, puis on renvoie vers la connexion.
    const onConnectError = (err: Error) => {
      if (err.message !== 'unauthorized') return; // simple coupure réseau : socket.io réessaie tout seul
      if (refreshed) {
        toLogin();
        return;
      }
      refreshed = true;
      fetchWithAuth('/me')
        .then((res) => {
          if (cancelled) return;
          if (res.ok) socket.connect();
          else toLogin();
        })
        .catch(toLogin);
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', onConnectError);
    // RequireAuth vient d'appeler /me : les cookies d'auth sont à jour.
    socket.connect();

    return () => {
      cancelled = true;
      socket.disconnect();
      socket.off('connect', handleConnect);
      socket.off('connect_error', onConnectError);
    };
  }, [navigate, returnTo]);
}
