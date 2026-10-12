import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

// Fond commun des pages hors partie, avec un lien de retour optionnel.
export default function PageLayout({ children, backLink = true }: { children: ReactNode; backLink?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-neutral-950 to-black text-white p-4">
      {backLink && (
        <Link
          to="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-amber-400 transition-colors group z-50"
        >
          <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
          Menu Principal
        </Link>
      )}
      {children}
    </div>
  );
}

export function Suits({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center gap-3 text-3xl font-serif select-none ${className}`}>
      <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
    </div>
  );
}

export const inputClass =
  'w-full p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all';

export const primaryButtonClass =
  'w-full text-center p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-neutral-950 font-black text-lg uppercase tracking-wider hover:from-amber-400 hover:to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all';

export const secondaryButtonClass =
  'w-full text-center p-4 bg-neutral-900/60 rounded-xl text-gray-300 font-bold border border-neutral-700 text-sm uppercase tracking-wider hover:bg-neutral-800 hover:text-white hover:border-neutral-500 active:scale-95 transition-all';

export const panelClass =
  'relative w-full bg-black/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-md overflow-hidden';
