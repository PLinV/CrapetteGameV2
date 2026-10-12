import type { CSSProperties } from 'react';

type CrapetteButtonProps = {
  enabled: boolean;
  onClick: () => void;
  style?: CSSProperties;
};

// Gros bouton rouge serti d'or, grisé quand on ne peut pas crier « Crapette ! ».
export default function CrapetteButton({ enabled, onClick, style }: CrapetteButtonProps) {
  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      style={style}
      title={enabled ? "Signaler une faute de l'adversaire" : "Disponible pendant le tour adverse"}
      className="w-[250px] h-[96px] rounded-full p-[4px] bg-gradient-to-b from-[#ffe8a1] via-[#d4af37] to-[#8a6d1d] shadow-[0_6px_0_#5c4813,0_12px_20px_rgba(0,0,0,0.55)] transition-all
        enabled:cursor-pointer enabled:hover:-translate-y-0.5 enabled:hover:brightness-110
        enabled:active:translate-y-[5px] enabled:active:shadow-[0_1px_0_#5c4813,0_4px_8px_rgba(0,0,0,0.5)]
        disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-full bg-[radial-gradient(circle_at_50%_25%,#c0392b_0%,#8b0000_55%,#4a0000_100%)] shadow-[inset_0_2px_6px_rgba(255,255,255,0.25),inset_0_-6px_12px_rgba(0,0,0,0.45)]">
        <span className="font-serif text-[30px] leading-none font-black uppercase tracking-[0.12em] text-[#ffe8a1] [text-shadow:0_2px_0_#4a0000,0_0_12px_rgba(255,232,161,0.35)]">
          Crapette
        </span>
        <span className="text-[11px] leading-none tracking-[0.5em] text-[#ffe8a1]/70">♠♥♦♣</span>
      </span>
    </button>
  );
}
