import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import { fetchWithAuth } from '../services/api';

// Connecte le socket tant que la page est affichée. `onConnect` est appelé à chaque connexion,
// y compris après une coupure réseau. `returnTo` : page où revenir si la session a expiré.
// Renvoie true quand la connexion au serveur est perdue (socket.io retente alors tout seul).
export function useSocketConnection(onConnect: () => void, returnTo: string) {
  const navigate = useNavigate();
  const [connectionLost, setConnectionLost] = useState(false);
  const onConnectRef = useRef(onConnect);
  useEffect(() => {
    onConnectRef.current = onConnect;
  });

  useEffect(() => {
    let cancelled = false;
    let refreshed = false;
    const handleConnect = () => {
      refreshed = false;
      setConnectionLost(false);
      onConnectRef.current();
    };
    // Fermeture voulue par la page (changement de page) : ce n'est pas une coupure.
    const handleDisconnect = (reason: string) => setConnectionLost(reason !== 'io client disconnect');
    // Le navigateur signale la coupure tout de suite, alors que le socket peut mettre plusieurs secondes à la voir.
    const handleOffline = () => setConnectionLost(true);
    const handleOnline = () => setConnectionLost(!socket.connected);

    const toLogin = () => navigate('/login', { replace: true, state: { from: returnTo } });
    // Le serveur refuse les sockets sans compte connecté. L'access token (15 min) a pu expirer
    // avant une reconnexion : on le rafraîchit une fois, puis on renvoie vers la connexion.
    const onConnectError = (err: Error) => {
      if (err.message !== 'unauthorized') {
        setConnectionLost(true); // serveur injoignable : socket.io réessaie tout seul
        return;
      }
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
    socket.on('disconnect', handleDisconnect);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    // RequireAuth vient d'appeler /me : les cookies d'auth sont à jour.
    socket.connect();

    return () => {
      cancelled = true;
      socket.disconnect();
      socket.off('connect', handleConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', handleDisconnect);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [navigate, returnTo]);

  return connectionLost;
}
