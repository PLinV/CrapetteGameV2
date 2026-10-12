import { Cj, Ck, Cq, Dj, Dk, Dq, Hj, Hk, Hq, Sj, Sk, Sq } from '@letele/playing-cards';

type CardProps = {
  val?: number;
  symbole?: string;
  isFaceDown: boolean;
  dosCouleur: 'rouge' | 'bleu';
};

const SYMBOLES: Record<string, string> = { Spade: '♠', Heart: '♥', Diamond: '♦', Club: '♣' };
const INDICES: Record<number, string> = { 1: 'A', 11: 'V', 12: 'D', 13: 'R' };

// Portraits des figures (jeu d'Adrian Kennard, domaine public), indexés par enseigne puis valeur.
const FIGURES: Record<string, Record<number, typeof Hk>> = {
  Spade: { 11: Sj, 12: Sq, 13: Sk },
  Heart: { 11: Hj, 12: Hq, 13: Hk },
  Diamond: { 11: Dj, 12: Dq, 13: Dk },
  Club: { 11: Cj, 12: Cq, 13: Ck },
};
// Cadre du portrait dans le SVG d'origine : on masque ses coins aux lettres anglaises (J/Q/K).
const PORTRAIT_VIEWBOX = '-83 -131 166 262';

// Position des symboles pour les cartes 2 à 10 : [x, y] en fraction de la zone centrale.
const PIPS: Record<number, [number, number][]> = {
  2: [[0.5, 0], [0.5, 1]],
  3: [[0.5, 0], [0.5, 0.5], [0.5, 1]],
  4: [[0, 0], [1, 0], [0, 1], [1, 1]],
  5: [[0, 0], [1, 0], [0.5, 0.5], [0, 1], [1, 1]],
  6: [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  7: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]],
  8: [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0.5, 0.75], [0, 1], [1, 1]],
  9: [[0, 0], [1, 0], [0, 1 / 3], [1, 1 / 3], [0.5, 0.5], [0, 2 / 3], [1, 2 / 3], [0, 1], [1, 1]],
  10: [[0, 0], [1, 0], [0.5, 1 / 6], [0, 1 / 3], [1, 1 / 3], [0, 2 / 3], [1, 2 / 3], [0.5, 5 / 6], [0, 1], [1, 1]],
};

function CardCenter({ val, symbole, sym }: { val: number; symbole: string; sym: string }) {
  const Figure = FIGURES[symbole]?.[val];
  if (Figure) {
    return (
      <div className="absolute inset-y-[6px] inset-x-[17px]">
        <Figure viewBox={PORTRAIT_VIEWBOX} width="100%" height="100%" />
      </div>
    );
  }

  if (val === 1) return <div className="absolute inset-0 flex items-center justify-center text-7xl">{sym}</div>;

  return (
    <div className="absolute inset-y-[19px] inset-x-[28px]">
      {PIPS[val]?.map(([x, y], i) => (
        <span
          key={i}
          className="absolute text-[25px] leading-none"
          // Comme sur un vrai jeu, les symboles de la moitié basse sont retournés.
          style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, -50%)${y > 0.5 ? ' rotate(180deg)' : ''}` }}
        >
          {sym}
        </span>
      ))}
    </div>
  );
}

export default function Card({ val, symbole = '', isFaceDown, dosCouleur }: CardProps) {
  const sym = SYMBOLES[symbole] ?? '';
  const textColor = symbole === 'Heart' || symbole === 'Diamond' ? 'text-red-600' : 'text-slate-900';
  const backColor = dosCouleur === 'rouge' ? 'bg-red-800' : 'bg-blue-800';

  const corner = (position: string) => (
    <div className={`absolute ${position} flex flex-col items-center font-bold leading-none`}>
      <span className="text-[17px] tracking-tighter">{val ? (INDICES[val] ?? val) : ''}</span>
      <span className="text-[16px]">{sym}</span>
    </div>
  );

  return (
    <div className="w-[95px] h-[140px] select-none touch-none rounded-lg [perspective:1000px] shadow-[2px_5px_10px_rgba(0,0,0,0.4)] pointer-events-auto">
      <div
        className={`relative w-full h-full rounded-lg transition-transform duration-500 ease-in-out [transform-style:preserve-3d] shadow-md ${
          isFaceDown ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* face avant */}
        <div className={`absolute inset-0 bg-gradient-to-br from-white to-gray-100 border border-gray-300 rounded-lg [backface-visibility:hidden] ${textColor}`}>
          {corner('top-1 left-1')}
          {val && <CardCenter val={val} symbole={symbole} sym={sym} />}
          {corner('bottom-1 right-1 rotate-180')}
        </div>

        {/* dos */}
        <div
          className={`absolute inset-0 border-4 border-white ${backColor} bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.2)_4px,rgba(255,255,255,0.2)_8px)] rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex justify-center items-center`}
        >
          <div className="w-[75px] h-[120px] border-2 border-white/40 rounded-md" />
        </div>
      </div>
    </div>
  );
}
