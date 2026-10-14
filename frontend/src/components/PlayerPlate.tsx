import type { CSSProperties } from 'react';
import Avatar from './Avatar';

type PlayerPlateProps = {
  username: string | null;
  avatarUrl: string | null;
  isMe: boolean;
  dos: 'rouge' | 'bleu';
  cardsLeft: number; // crapette + talon + défausse
  isActive: boolean; // c'est à lui de jouer
  onPassTurn?: () => void; // bouton « Passer mon tour », sur la plaque du joueur pendant son tour
  style?: CSSProperties;
};

const DOS = {
  rouge: { label: 'Cartes rouges', dot: 'bg-red-600' },
  bleu: { label: 'Cartes bleues', dot: 'bg-blue-600' },
};

// Plaque d'un joueur sur le plateau : pseudo, couleur de ses cartes et cartes qu'il lui reste.
export default function PlayerPlate({ username, avatarUrl, isMe, dos, cardsLeft, isActive, onPassTurn, style }: PlayerPlateProps) {
  const name = username ?? '…';

  return (
    <div
      style={style}
      className={`w-full h-[120px] flex items-center gap-4 px-5 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 ${
        isActive
          ? 'bg-black/50 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.45)]'
          : 'bg-black/30 border-white/10'
      }`}
    >
      <Avatar url={avatarUrl} name={name} size={72} gold={isMe} />

      <div className="min-w-0 flex flex-col gap-1">
        <span className={`text-2xl font-black truncate ${isMe ? 'text-amber-300' : 'text-white'}`}>
          {name}
          {isMe && <span className="ml-2 text-sm font-bold text-amber-400/70">(vous)</span>}
        </span>
        <span className="flex items-center gap-2 text-sm font-bold text-white/60">
          <span className={`w-3 h-3 rounded-full ${DOS[dos].dot}`} />
          {DOS[dos].label} · {cardsLeft} carte{cardsLeft > 1 ? 's' : ''}
        </span>
        {isActive && onPassTurn ? (
          <button
            onClick={onPassTurn}
            className="self-start mt-1 px-4 py-1.5 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-900 border-2 border-amber-500/70 text-sm font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 hover:border-amber-300 active:scale-95 transition-all cursor-pointer"
          >
            Passer mon tour ⏭
          </button>
        ) : (
          <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-amber-400 animate-pulse' : 'invisible'}`}>
            {isMe ? 'À vous de jouer' : 'Joue...'}
          </span>
        )}
      </div>
    </div>
  );
}
