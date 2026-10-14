import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import { fetchWithAuth } from '../services/api';
import { useCurrentUser } from './useCurrentUser';

export type CarteData = {
  id: string;
  zoneId: string;
  zOrder: number;
  isFaceDown: boolean;
  dosCouleur: 'rouge' | 'bleu';
  val?: number; // absents si la carte est face cachée
  symbole?: string;
};

export type AdminAction = 'nearly_win' | 'give_turn' | 'force_win' | 'new_game';

type Message = { text: string; kind: 'error' | 'crapette' };

type Seat = 1 | 2; // 1 = cartes rouges, 2 = cartes bleues

type GameState = {
  turn: Seat | null;
  cartes: CarteData[];
  selectableZones: string[];
  winner: Seat | null; // null tant que la partie continue
  wonByForfeit: boolean; // le perdant n'est pas revenu à temps
  rematchVotes: Seat[]; // joueurs qui ont demandé la revanche
  players: (PlayerInfo | null)[]; // par numéro de joueur
};

// connected : faux si le joueur a quitté la table (sa place et la partie l'attendent).
// forfeitDeadline : heure (ms) à laquelle il perd par forfait s'il n'est pas revenu, sinon null.
export type PlayerInfo = { username: string; avatarUrl: string | null; connected: boolean; forfeitDeadline: number | null };

type ServerPlayer = Omit<PlayerInfo, 'forfeitDeadline'> & { forfeitInMs: number | null };

// Le serveur envoie un temps restant : on le convertit en heure locale, pour le compte à rebours.
const withDeadlines = (state: Omit<GameState, 'players'> & { players: (ServerPlayer | null)[] }): GameState => ({
  ...state,
  players: state.players.map((player) => {
    if (!player) return null;
    const { forfeitInMs, ...rest } = player;
    return { ...rest, forfeitDeadline: forfeitInMs === null ? null : Date.now() + forfeitInMs };
  }),
});

export function useGame(roomId: string) {
  const navigate = useNavigate();
  const [mySeat, setMySeat] = useState<Seat | null>(null);
  const mySeatRef = useRef<Seat | null>(null);
  const [state, setState] = useState<GameState | null>(null); // null = en attente d'un adversaire
  const [message, setMessage] = useState<Message | null>(null);
  const { isAdmin } = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    let refreshed = false;
    const join = () => {
      refreshed = false;
      socket.emit('join_room', { roomId });
    };
    const onSeat = (seat: Seat) => {
      mySeatRef.current = seat;
      setMySeat(seat);
    };
    const onState = (serverState: Parameters<typeof withDeadlines>[0]) => setState(withDeadlines(serverState));
    const onWaiting = () => setState(null);
    const onActionError = (text: string) => setMessage({ text, kind: 'error' });
    const onCrapette = (callerSeat: Seat) =>
      setMessage({
        text: callerSeat === mySeatRef.current ? 'Crapette ! À vous de jouer' : 'Crapette ! Votre adversaire reprend la main',
        kind: 'crapette',
      });
    const onRoomError = (msg: string) => {
      alert(msg);
      navigate('/matchmaking');
    };

    const toLogin = () => navigate('/login', { replace: true, state: { from: `/game/${roomId}` } });
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

    socket.on('connect', join); // à chaque connexion, y compris après une coupure réseau
    socket.on('connect_error', onConnectError);
    socket.on('seat', onSeat);
    socket.on('game_state', onState);
    socket.on('waiting_for_opponent', onWaiting);
    socket.on('action_error', onActionError);
    socket.on('crapette_called', onCrapette);
    socket.on('room_error', onRoomError);

    // RequireAuth vient d'appeler /me : les cookies d'auth sont à jour.
    socket.connect();

    return () => {
      cancelled = true;
      socket.disconnect();
      socket.off('connect', join);
      socket.off('connect_error', onConnectError);
      socket.off('seat', onSeat);
      socket.off('game_state', onState);
      socket.off('waiting_for_opponent', onWaiting);
      socket.off('action_error', onActionError);
      socket.off('crapette_called', onCrapette);
      socket.off('room_error', onRoomError);
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return {
    state,
    message,
    mySeat,
    isMyTurn: !!state && state.turn === mySeat,
    isPlayer1: mySeat === 1,
    draw: () => socket.emit('draw_card'),
    move: (from: string, to: string) => socket.emit('move_card', { from, to }),
    passTurn: () => socket.emit('pass_turn'),
    callCrapette: () => socket.emit('call_crapette'),
    playAgain: () => socket.emit('play_again'),
    isAdmin,
    adminAction: (action: AdminAction, target: 'me' | 'opponent' = 'me') => socket.emit('admin_action', { action, target }),
    leave: () => socket.emit('leave_room'),
  };
}
