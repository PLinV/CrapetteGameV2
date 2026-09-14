import { motion } from 'framer-motion';
import Card from './Card';
import CardStack, { getGridPlacement } from './CardStack'; 
import { ZONES_PLATEAU } from '../../../constant/plateau';
import type { CarteData } from './useGame';

type BoardProps = {
  cartes: CarteData[];
  opponentDrag: { id: string, mousePos: {x:number, y:number}, dragOffset: {x:number, y:number} } | null; 
  onCardClick: (carteId: string) => void;
  onDragStart: (carteId: string, zoneId: string) => void;
  onDrag: (e: any, info: any, carteId: string) => void;
  onDragEnd: (e: any, info: any, carteId: string) => void;
  selectableZones: string[];
  isPlayer1: boolean;
};

const getOffsetByZone = (zoneId: string) => {
  if (['31', '32', '33', '34'].includes(zoneId)) return - 50; 
  if (['35', '36', '37', '38'].includes(zoneId)) return 50;  
  return 0; 
};

export default function Board({ 
  cartes, onCardClick, onDragStart, onDrag, onDragEnd, selectableZones, isPlayer1 
}: BoardProps) {

  const labelHaut = isPlayer1 ? "Vous (Cartes Rouges)" : "Adversaire";
  const labelBas = isPlayer1 ? "Adversaire" : "Vous (Cartes Bleues)";

  return (
    <div className="relative p-[60px_80px] bg-[radial-gradient(circle,_#2a723f_0%,_#113a1e_100%)] border-[18px] border-[#3e2723] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8),_inset_0_0_40px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-1 border-3 border-[#d4af37] rounded-[20px] pointer-events-none shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

      <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <span className={`font-black uppercase tracking-[0.4em] text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] ${isPlayer1 ? 'text-amber-400/80' : 'text-white/30'}`}>
          {labelHaut}
        </span>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <span className={`font-black uppercase tracking-[0.4em] text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] ${!isPlayer1 ? 'text-amber-400/80' : 'text-white/30'}`}>
          {labelBas}
        </span>
      </div>

      <div className="grid grid-cols-[repeat(28,32px)] grid-rows-[repeat(6,160px)] gap-[15px]">
        
        {ZONES_PLATEAU.map((zoneId) => (
          <CardStack key={`zone-${zoneId}`} zoneId={zoneId} />
        ))}

        {cartes.map((carte) => {
          const cartesDeCetteZone = cartes
            .filter(c => c.zoneId === carte.zoneId)
            .sort((a, b) => a.zOrder - b.zOrder);

          const index = cartesDeCetteZone.findIndex(c => c.id === carte.id);
          const isTopCard = index === cartesDeCetteZone.length - 1;
          const offsetStep = getOffsetByZone(carte.zoneId);
          const isHorizontal = carte.zoneId.startsWith('4') || carte.zoneId.startsWith('5');
          
          const gridPlacement = getGridPlacement(carte.zoneId);
          const isDraggable = selectableZones.includes(carte.zoneId) && isTopCard && !carte.isFaceDown;

          const translateY = index * offsetStep;

          // 🚨 1. LE STYLE DU CONTENEUR INVISIBLE
          // Il gère la grille et applique le décalage proprement via un transform pur
          const parentWrapperStyle: React.CSSProperties = {
            gridColumn: gridPlacement.gridColumn,
            gridRow: gridPlacement.gridRow,
            placeSelf: 'center',
            zIndex: carte.zOrder, 
            transform: `translateY(${translateY}px)` 
          };

          return (
            <div key={`wrapper-${carte.id}`} style={parentWrapperStyle}>
              
              <motion.div
                id={`card-${carte.id}`} 
                key={carte.id} 
                layout 
                
                data-zone={carte.zoneId}
                data-card-id={carte.id} 
                
                drag={isDraggable}
                dragMomentum={false} 
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={1} 
                
                // 🚨 2. FRAMER MOTION RESTE PARFAITEMENT À ZÉRO
                // L'animation ne rentrera plus en conflit avec ton décalage de quinconce !
                animate={{ 
                  x: 0, 
                  y: 0, 
                  rotate: isHorizontal ? 90 : 0,
                  scale: 1 
                }}
                
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                whileDrag={{ scale: 1.05, rotate: 0, zIndex: 9999 }} 
                
                onDragStart={() => onDragStart(carte.id, carte.zoneId)}
                onDrag={(e, info) => onDrag(e, info, carte.id)}
                onDragEnd={(e, info) => onDragEnd(e, info, carte.id)}
                
                className={`flex justify-center items-center pointer-events-auto ${
                  isHorizontal ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'
                }`}
              >
                <div 
                  className={`${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} relative`}
                  onPointerDown={(e) => {
                    if (e.button === 0 && isTopCard && carte.isFaceDown) {
                      onCardClick(carte.id);
                    }
                  }}
                >
                  <Card
                    val={carte.val}
                    symbole={carte.symbole}
                    couleur={carte.couleur}
                    isFaceDown={carte.isFaceDown}
                    dosCouleur={carte.dosCouleur}
                  />
                </div>
              </motion.div>
              
            </div>
          );
        })}

        <button className="col-start-23 col-span-6 row-start-6 translate-y-8 self-center w-full h-[110px] bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] rounded-xl border-3 border-white text-[#8b0000] text-4xl font-black uppercase cursor-pointer shadow-[0_10px_20px_rgba(0,0,0,0.5),_inset_0_-5px_10px_rgba(0,0,0,0.2)] active:translate-y-[37px] active:shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-all [text-shadow:1px_1px_2px_rgba(255,255,255,0.8)] pointer-events-auto z-10">
          Crapette
        </button>
      </div>
    </div>
  );
}