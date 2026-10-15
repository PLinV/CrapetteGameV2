import { useState } from 'react';
import type { AdminAction } from '../hooks/useGame';

type AdminPanelProps = {
  onAction: (action: AdminAction, target?: 'me' | 'opponent') => void;
};

const ROWS: { action: AdminAction; label: string }[] = [
  { action: 'nearly_win', label: 'À un coup de gagner' },
  { action: 'give_turn', label: 'Donner la main' },
  { action: 'empty_talon', label: 'Vider la pioche' },
  { action: 'force_win', label: 'Faire gagner' },
];

const buttonClass =
  'px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs font-bold text-gray-200 cursor-pointer active:scale-95 transition-all';

// Outils de test réservés aux comptes admin (le serveur vérifie aussi le rôle).
export default function AdminPanel({ onAction }: AdminPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-[95] flex flex-col items-start gap-2">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-full bg-purple-900/80 border border-purple-500/60 text-xs font-black uppercase tracking-widest text-purple-200 hover:bg-purple-800 cursor-pointer"
      >
        🛠 Admin {open ? '▴' : '▾'}
      </button>

      {open && (
        <div className="p-4 rounded-2xl bg-black/90 border border-purple-500/40 shadow-2xl backdrop-blur-md flex flex-col gap-3">
          <div className="grid grid-cols-[auto_auto_auto] gap-2 items-center">
            <span />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Moi</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Adversaire</span>
            {ROWS.map(({ action, label }) => (
              <div key={action} className="contents">
                <span className="text-xs text-gray-300 pr-2">{label}</span>
                <button className={buttonClass} onClick={() => onAction(action, 'me')}>Moi</button>
                <button className={buttonClass} onClick={() => onAction(action, 'opponent')}>Lui</button>
              </div>
            ))}
          </div>
          <button className={`${buttonClass} w-full`} onClick={() => onAction('new_game')}>
            🔄 Nouvelle donne
          </button>
        </div>
      )}
    </div>
  );
}
