// frontend/src/components/Board.tsx
import { PointerEvent } from 'react';
import Card from './Card';
import CardStack, { getGridPlacement } from './CardStack'; 
import { ZONES_PLATEAU } from '../../../constant/plateau';
import type { CarteData } from './useGame';

type BoardProps = {
  cartes: CarteData[];
  draggingId: string | null;
  mousePos: { x: number, y: number };
  dragOffset: { x: number, y: number };
  onCardPointerDown: (e: PointerEvent<HTMLDivElement>, carteId: string) => void;
  onCardClick: (carteId: string) => void; 
};

const getOffsetByZone = (zoneId: string) => {
  if (['31', '32', '33', '34'].includes(zoneId)) return - 25; 
  if (['35', '36', '37', '38'].includes(zoneId)) return 25;  
  return 0; 
};

export default function Board({ cartes, draggingId, mousePos, dragOffset, onCardPointerDown, onCardClick }: BoardProps) { 
  return (
    <div className="relative p-[60px_80px] bg-[radial-gradient(circle,_#2a723f_0%,_#113a1e_100%)] border-[18px] border-[#3e2723] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8),_inset_0_0_40px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-1 border-3 border-[#d4af37] rounded-[20px] pointer-events-none shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

      {/* CORRECTION 2 : Ajout de grid-rows-[repeat(6,160px)] pour forcer l'espacement parfait */}
      <div className="grid grid-cols-[repeat(28,32px)] grid-rows-[repeat(6,160px)] gap-[15px]">
        
        {ZONES_PLATEAU.map((zoneId) => (
          <CardStack key={`zone-${zoneId}`} zoneId={zoneId} />
        ))}

        {cartes.map((carte) => {
          const isDragging = carte.id === draggingId;
          const cartesDeCetteZone = cartes
            .filter(c => c.zoneId === carte.zoneId)
            .sort((a, b) => a.zOrder - b.zOrder);

          const index = cartesDeCetteZone.findIndex(c => c.id === carte.id);
          const isTopCard = index === cartesDeCetteZone.length - 1;
          const offsetStep = getOffsetByZone(carte.zoneId);
          const isHorizontal = carte.zoneId.startsWith('4') || carte.zoneId.startsWith('5');
          
          const gridPlacement = getGridPlacement(carte.zoneId);

          const wrapperStyle: React.CSSProperties = {
            gridColumn: gridPlacement.gridColumn,
            gridRow: gridPlacement.gridRow,
            placeSelf: 'center', // Centre parfaitement la carte dans sa cellule de 160px
            zIndex: isDragging ? 9999 : carte.zOrder, 
          };

          const carteStyle: React.CSSProperties = {
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          };

          if (isDragging) {
            carteStyle.left = `${mousePos.x - dragOffset.x}px`;
            carteStyle.top = `${mousePos.y - dragOffset.y}px`;
            carteStyle.margin = 0;
            carteStyle.position = 'fixed'; 
            carteStyle.zIndex = 9999;
            carteStyle.transform = 'scale(1.1) rotate(0deg)'; 
          } else {
            const translateY = index * offsetStep;
            const rotation = isHorizontal ? 'rotate(90deg)' : 'rotate(0deg)';
            carteStyle.position = 'relative'; 
            carteStyle.transform = `translateY(${translateY}px) ${rotation}`;
          }

          return (
            <div
              key={carte.id}
              style={wrapperStyle}
              // CORRECTION 3 : L'attribut data-zone permet à la souris de détecter la zone visée !
              data-zone={carte.zoneId}
              className={`pointer-events-none flex justify-center items-center ${
                isHorizontal ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'
              }`}
            >
              <Card
                val={carte.val}
                symbole={carte.symbole}
                couleur={carte.couleur}
                isDragging={isDragging}
                // elle est draggable SEULEMENT si elle n'est pas face cachée
                isDraggable={isTopCard && !carte.isFaceDown}
                isFaceDown={carte.isFaceDown}
                dosCouleur={carte.dosCouleur}
                style={carteStyle}
                onPointerDown={(e) => {
                  // clic gauche obligatoire
                  if (e.button !== 0) return;
                  
                  if (isTopCard && !carte.isFaceDown) {
                    // si elle est face visible, on la drag
                    onCardPointerDown(e, carte.id);
                  } else if (isTopCard && carte.isFaceDown) {
                    // si elle est face cachée, on la clique pour la retourner !
                    onCardClick(carte.id);
                  }
                }}
              />
            </div>
          );
        })}

        <button className="col-start-23 col-span-6 row-start-6 translate-y-8 self-center w-full h-[110px] bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] rounded-xl border-3 border-white text-[#8b0000] text-4xl font-black uppercase cursor-pointer shadow-[0_10px_20px_rgba(0,0,0,0.5),_inset_0_-5px_10px_rgba(0,0,0,0.2)] active:translate-y-[37px] active:shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all [text-shadow:1px_1px_2px_rgba(255,255,255,0.8)] z-10">
          Crapette
        </button>
      </div>
    </div>
  );
}