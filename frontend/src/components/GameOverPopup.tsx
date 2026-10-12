import { Suits, primaryButtonClass, secondaryButtonClass } from './PageLayout';

type GameOverPopupProps = {
  won: boolean;
  iAskedRematch: boolean;
  opponentAskedRematch: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
};

export default function GameOverPopup({ won, iAskedRematch, opponentAskedRematch, onPlayAgain, onLeave }: GameOverPopupProps) {
  return (
    <div className="absolute inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full max-w-md mx-4 p-10 rounded-3xl bg-black/60 border border-[#d4af37]/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <Suits className={`relative mb-4 ${won ? 'text-amber-500/60' : 'text-gray-600'}`} />
        <h2
          className={`relative text-6xl font-black uppercase tracking-widest text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(212,175,55,0.25)] ${
            won ? 'bg-gradient-to-b from-[#ffe8a1] to-[#d4af37]' : 'bg-gradient-to-b from-gray-300 to-gray-500'
          }`}
        >
          {won ? 'Victoire' : 'Défaite'}
        </h2>
        <p className="relative mt-3 mb-8 text-sm uppercase tracking-widest text-gray-400">
          {won ? "Vous n'avez plus aucune carte !" : "Votre adversaire s'est débarrassé de toutes ses cartes."}
        </p>

        <div className="relative flex flex-col gap-3">
          <button onClick={onPlayAgain} disabled={iAskedRematch} className={`${primaryButtonClass} cursor-pointer disabled:opacity-60 disabled:cursor-default disabled:active:scale-100`}>
            {iAskedRematch ? "En attente de l'adversaire..." : 'Revanche'}
          </button>
          <button onClick={onLeave} className={`${secondaryButtonClass} cursor-pointer`}>
            Menu principal
          </button>
        </div>

        {opponentAskedRematch && !iAskedRematch && (
          <p className="relative mt-5 text-sm font-bold text-amber-400 animate-pulse">Votre adversaire veut une revanche !</p>
        )}
      </div>
    </div>
  );
}
