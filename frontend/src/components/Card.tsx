// frontend/src/components/Card.tsx
import { PointerEvent, CSSProperties } from 'react';

type CardProps = {
  val: string;
  symbole: string;
  couleur: 'rouge' | 'noir';
  isDragging?: boolean;
  isDraggable?: boolean;
  isFaceDown?: boolean;           
  dosCouleur?: 'rouge' | 'bleu';  
  style?: CSSProperties;
  onPointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
};

export default function Card({ val, symbole, couleur, isDragging, isDraggable = true, isFaceDown = false, dosCouleur = 'rouge', style, onPointerDown }: CardProps) {
  
  const textColor = couleur === 'rouge' ? 'text-red-600' : 'text-gray-900';
  const backPatternColor = dosCouleur === 'rouge' ? 'bg-red-800' : 'bg-blue-800';
  const patternStyle = `bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.2)_4px,rgba(255,255,255,0.2)_8px)]`;

  return (
    <div
      onPointerDown={onPointerDown}
      style={style}
      // On ajoute [perspective:1000px] pour activer la 3D
      className={`
        w-[95px] h-[140px] select-none touch-none rounded-lg [perspective:1000px]
        ${isDragging 
          ? 'fixed z-[9999] cursor-grabbing scale-110 shadow-[15px_25px_30px_rgba(0,0,0,0.6)] pointer-events-none' 
          : (isDraggable ? 'cursor-grab shadow-[2px_5px_10px_rgba(0,0,0,0.4)] pointer-events-auto' : 'cursor-pointer shadow-[1px_2px_5px_rgba(0,0,0,0.5)] pointer-events-auto')
        }
      `}
    >
      {/* C'est ce conteneur intérieur qui tourne à 180° grâce à isFaceDown */}
      <div 
        className={`
          relative w-full h-full rounded-lg transition-transform duration-500 ease-in-out [transform-style:preserve-3d] shadow-md
          ${isFaceDown ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
        `}
      >
        {/* --- FACE AVANT --- */}
        <div className={`absolute inset-0 bg-gradient-to-br from-white to-gray-100 border border-gray-300 rounded-lg flex justify-center items-center text-5xl ${textColor} [backface-visibility:hidden]`}>
          <div className="absolute top-1 left-1 flex flex-row items-baseline gap-[2px] text-xl font-bold leading-none">
            <span>{val}</span><span className="text-lg">{symbole}</span>
          </div>
          {symbole}
          <div className="absolute bottom-1 right-1 flex flex-row items-baseline gap-[2px] text-xl font-bold leading-none rotate-180">
            <span>{val}</span><span className="text-lg">{symbole}</span>
          </div>
        </div>

        {/* --- FACE ARRIÈRE (DOS) --- */}
        <div className={`absolute inset-0 border-4 border-white ${backPatternColor} ${patternStyle} rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)] flex justify-center items-center`}>
          <div className="w-[75px] h-[120px] border-2 border-white/40 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}