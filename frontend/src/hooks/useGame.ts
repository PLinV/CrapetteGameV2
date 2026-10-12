import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

export type CarteData = {
  id: string;
  zoneId: string;
  zOrder: number;
  isFaceDown: boolean;
  dosCouleur: 'rouge' | 'bleu';
  val?: number; // absents si la carte est face cachée
  symbole?: string;
};

type Message = { text: string; kind: 'error' | 'crapette' };

type GameState = {
  players: [string | null, string | null];
  turn: string | null;
  cartes: CarteData[];
  selectableZones: string[];
};

// Identifiant du joueur, conservé dans l'onglet pour retrouver sa place après un rechargement.
function getUserId(): string {
  let userId = sessionStorage.getItem('crapette_userId');
  if (!userId) {
    userId = 'player_' + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('crapette_userId', userId);
  }
  return userId;
}

export function useGame(roomId: string) {
  const navigate = useNavigate();
  const [myId] = useState(getUserId);
  const [state, setState] = useState<GameState | null>(null); // null = en attente d'un adversaire
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    const join = () => socket.emit('join_room', { roomId, userId: myId });
    const onWaiting = () => setState(null);
    const onActionError = (text: string) => setMessage({ text, kind: 'error' });
    const onCrapette = (callerId: string) =>
      setMessage({
        text: callerId === myId ? 'Crapette ! À vous de jouer' : 'Crapette ! Votre adversaire reprend la main',
        kind: 'crapette',
      });
    const onRoomError = (msg: string) => {
      alert(msg);
      navigate('/matchmaking');
    };

    socket.on('connect', join); // on se ré-assoit à la table après une coupure réseau
    socket.on('game_state', setState);
    socket.on('waiting_for_opponent', onWaiting);
    socket.on('action_error', onActionError);
    socket.on('crapette_called', onCrapette);
    socket.on('room_error', onRoomError);
    join();

    return () => {
      socket.off('connect', join);
      socket.off('game_state', setState);
      socket.off('waiting_for_opponent', onWaiting);
      socket.off('action_error', onActionError);
      socket.off('crapette_called', onCrapette);
      socket.off('room_error', onRoomError);
    };
  }, [roomId, myId, navigate]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return {
    state,
    message,
    isMyTurn: state?.turn === myId,
    isPlayer1: state?.players[0] === myId,
    draw: () => socket.emit('draw_card'),
    move: (from: string, to: string) => socket.emit('move_card', { from, to }),
    passTurn: () => socket.emit('pass_turn'),
    callCrapette: () => socket.emit('call_crapette'),
    leave: () => socket.emit('leave_room'),
  };
}
