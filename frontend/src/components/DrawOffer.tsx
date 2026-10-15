import { useSecondsLeft } from '../hooks/useSecondsLeft';

type DrawButtonProps = {
  pending: boolean; // j'ai proposé le nul, l'adversaire n'a pas encore répondu
  readyAt: number; // après un refus : heure (ms) à partir de laquelle on peut le reproposer
  onOffer: () => void;
  onCancel: () => void;
  compact?: boolean; // version pour l'en-tête du chat ; sinon bouton rond à côté de la bulle
};

// Bouton 🤝 pour proposer un match nul (ou retirer sa proposition), avec le délai après un refus.
export function DrawButton({ pending, readyAt, onOffer, onCancel, compact = false }: DrawButtonProps) {
  const secondsLeft = useSecondsLeft(readyAt);
  const title = pending
    ? 'Proposition envoyée : cliquer pour la retirer'
    : secondsLeft > 0
      ? `Proposition refusée : de nouveau possible dans ${secondsLeft} s`
      : 'Proposer un match nul';

  if (compact) {
    return (
      <button
        onClick={pending ? onCancel : onOffer}
        disabled={!pending && secondsLeft > 0}
        title={title}
        className={`h-9 px-3 rounded-full text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default ${
          pending ? 'border-amber-400 text-amber-300 bg-amber-400/10 animate-pulse' : 'border-white/15 text-gray-300 hover:text-white hover:bg-white/10'
        }`}
      >
        🤝 {pending ? 'Proposé… annuler' : secondsLeft > 0 ? `Nul (${secondsLeft} s)` : 'Proposer le nul'}
      </button>
    );
  }

  return (
    <button
      onClick={pending ? onCancel : onOffer}
      disabled={!pending && secondsLeft > 0}
      title={title}
      aria-label={title}
      className={`relative w-14 h-14 rounded-full bg-neutral-800 border-2 text-2xl shadow-[0_6px_20px_rgba(0,0,0,0.6)] hover:bg-neutral-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:active:scale-100 ${
        pending ? 'border-amber-300 animate-pulse' : 'border-amber-500/70 hover:border-amber-300'
      }`}
    >
      🤝
      {!pending && secondsLeft > 0 && (
        <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-neutral-600 text-[10px] font-black text-white flex items-center justify-center tabular-nums">
          {secondsLeft}
        </span>
      )}
    </button>
  );
}

type DrawOfferPromptProps = {
  opponentName: string;
  onAnswer: (accept: boolean) => void;
};

// L'adversaire propose le match nul : on accepte ou on refuse.
export function DrawOfferPrompt({ opponentName, onAnswer }: DrawOfferPromptProps) {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] w-[min(92vw,420px)] px-6 py-5 rounded-2xl bg-neutral-900/95 border-2 border-amber-400/70 shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-center" role="dialog" aria-label="Proposition de match nul">
      <p className="text-lg font-black text-white">🤝 {opponentName} propose un match nul</p>
      <p className="mt-1 text-sm text-gray-400">La partie s'arrête et compte comme un nul pour vous deux.</p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => onAnswer(true)}
          className="px-5 py-2 rounded-full bg-amber-500 text-sm font-black uppercase tracking-wider text-black hover:bg-amber-400 cursor-pointer"
        >
          Accepter
        </button>
        <button
          onClick={() => onAnswer(false)}
          className="px-5 py-2 rounded-full border-2 border-white/20 text-sm font-black uppercase tracking-wider text-gray-200 hover:bg-white/10 cursor-pointer"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
