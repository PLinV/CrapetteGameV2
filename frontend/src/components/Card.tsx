type CardProps = {
  val?: number;
  symbole?: string;
  isFaceDown: boolean;
  dosCouleur: 'rouge' | 'bleu';
};

const SYMBOLES: Record<string, string> = { Spade: '♠', Heart: '♥', Diamond: '♦', Club: '♣' };
const FIGURES: Record<number, string> = { 1: 'A', 11: 'V', 12: 'D', 13: 'R' };

export default function Card({ val, symbole = '', isFaceDown, dosCouleur }: CardProps) {
  const displayVal = val ? (FIGURES[val] ?? String(val)) : '';
  const displaySym = SYMBOLES[symbole] ?? '';
  const textColor = symbole === 'Heart' || symbole === 'Diamond' ? 'text-red-600' : 'text-slate-900';
  const backColor = dosCouleur === 'rouge' ? 'bg-red-800' : 'bg-blue-800';

  const corner = (
    <>
      <span>{displayVal}</span>
      <span className="text-lg">{displaySym}</span>
    </>
  );

  return (
    <div className="w-[95px] h-[140px] select-none touch-none rounded-lg [perspective:1000px] shadow-[2px_5px_10px_rgba(0,0,0,0.4)] pointer-events-auto">
      <div
        className={`relative w-full h-full rounded-lg transition-transform duration-500 ease-in-out [transform-style:preserve-3d] shadow-md ${
          isFaceDown ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* face avant */}
        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 border border-gray-300 rounded-lg flex justify-center items-center [backface-visibility:hidden]">
          <div className={`absolute top-1 left-1.5 flex items-baseline gap-[1px] text-xl font-bold leading-none ${textColor}`}>
            {corner}
          </div>
          <div className={`text-6xl ${textColor}`}>{displaySym}</div>
          <div className={`absolute bottom-1 right-1.5 flex items-baseline gap-[1px] text-xl font-bold leading-none rotate-180 ${textColor}`}>
            {corner}
          </div>
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
