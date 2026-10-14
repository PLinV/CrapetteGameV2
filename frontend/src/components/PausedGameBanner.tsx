import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socket } from '../services/socket';
import { useSocketConnection } from '../hooks/useSocketConnection';
import Countdown from './Countdown';

// Partie quittée en cours de route : à reprendre avant la défaite par forfait (adversaire resté à la table),
// ou avant son annulation (les deux joueurs sont partis).
type PausedGame = { roomId: string; name: string; deadline: number; ending: 'forfeit' | 'cancel' };
type ServerPausedGame = Omit<PausedGame, 'deadline'> & { endsInMs: number };

// Rouge : l'adversaire attend, on risque de perdre. Jaune : les deux sont partis, la partie sera annulée.
const STYLES = {
  forfeit: { box: 'border-red-500/70 bg-red-950/50 hover:bg-red-900/50', title: 'text-red-300', text: 'text-red-200/80', label: 'forfait' },
  cancel: { box: 'border-amber-400/70 bg-amber-950/40 hover:bg-amber-900/40', title: 'text-amber-300', text: 'text-amber-200/80', label: 'partie annulée' },
};

// Bouton « Reprendre la partie » de l'accueil, tenu à jour en direct par le serveur
// (l'adversaire part ou revient, forfait, annulation).
export default function PausedGameBanner() {
  const [paused, setPaused] = useState<PausedGame | null>(null);

  useSocketConnection(() => socket.emit('watch_paused'), '/');

  useEffect(() => {
    const onPaused = (game: ServerPausedGame | null) =>
      setPaused(game && { roomId: game.roomId, name: game.name, ending: game.ending, deadline: Date.now() + game.endsInMs });
    socket.on('paused_game', onPaused);
    return () => {
      socket.off('paused_game', onPaused);
    };
  }, []);

  if (!paused) return null;
  const style = STYLES[paused.ending];

  return (
    <Link
      to={`/game/${encodeURIComponent(paused.roomId)}`}
      className={`w-full max-w-md text-center p-4 rounded-2xl border-2 transition-colors ${style.box}`}
    >
      <span className={`block text-lg font-black uppercase tracking-wider animate-pulse ${style.title}`}>Reprendre la partie</span>
      <span className={`block text-xs mt-1 ${style.text}`}>
        « {paused.name} » · {style.label} dans{' '}
        {/* À zéro, on retire le bouton sans attendre la confirmation du serveur. */}
        <Countdown key={paused.deadline} deadline={paused.deadline} onEnd={() => setPaused(null)} />
      </span>
    </Link>
  );
}
