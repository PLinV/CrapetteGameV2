import { motion, type PanInfo } from 'framer-motion';
import Card from './Card';
import CardStack from './CardStack';
import { getGridPlacement, isHorizontalZone, stackOffset } from './boardLayout';
import { ZONES_PLATEAU, ZONES } from '../../../constant/plateau';
import type { CarteData } from '../hooks/useGame';

type BoardProps = {
  cartes: CarteData[];
  selectableZones: string[];
  isPlayer1: boolean;
  isMyTurn: boolean;
  onDraw: () => void;
  onMove: (from: string, to: string) => void;
};

// Zone (emplacement vide ou carte) sous le pointeur, en ignorant la carte qu'on déplace.
const findZoneAt = (point: { x: number; y: number }, draggedId: string) => {
  for (const el of document.elementsFromPoint(point.x - window.scrollX, point.y - window.scrollY)) {
    const zone = el.closest<HTMLElement>('[data-zone]');
    if (zone && zone.dataset.cardId !== draggedId) return zone.dataset.zone;
  }
  return undefined;
};

export default function Board({ cartes, selectableZones, isPlayer1, isMyTurn, onDraw, onMove }: BoardProps) {
  const myTalon = isPlayer1 ? ZONES.joueur1.talon : ZONES.joueur2.talon;

  const topOrder: Record<string, number> = {};
  for (const carte of cartes) topOrder[carte.zoneId] = Math.max(topOrder[carte.zoneId] ?? -1, carte.zOrder);

  const label = (isMe: boolean, couleur: string) => (
    <span className={`font-black uppercase tracking-[0.4em] text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] ${isMe ? 'text-amber-400/80' : 'text-white/30'}`}>
      {isMe ? `Vous (Cartes ${couleur})` : 'Adversaire'}
    </span>
  );

  return (
    <div className="relative p-[60px_80px] bg-[radial-gradient(circle,_#2a723f_0%,_#113a1e_100%)] border-[18px] border-[#3e2723] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8),_inset_0_0_40px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-1 border-3 border-[#d4af37] rounded-[20px] pointer-events-none shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

      <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none z-10">{label(isPlayer1, 'Rouges')}</div>
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">{label(!isPlayer1, 'Bleues')}</div>

      <div className="grid grid-cols-[repeat(28,32px)] grid-rows-[repeat(6,160px)] gap-[15px]">
        {ZONES_PLATEAU.map((zoneId) => (
          <CardStack key={zoneId} zoneId={zoneId} />
        ))}

        {cartes.map((carte) => {
          const isTopCard = carte.zOrder === topOrder[carte.zoneId];
          const isDraggable = isMyTurn && isTopCard && !carte.isFaceDown && selectableZones.includes(carte.zoneId);
          const canDraw = isMyTurn && isTopCard && carte.zoneId === myTalon;
          const horizontal = isHorizontalZone(carte.zoneId);

          const onDragEnd = (_: unknown, info: PanInfo) => {
            const to = findZoneAt(info.point, carte.id);
            // Sinon la carte revient toute seule à sa place.
            if (to && to !== carte.zoneId) onMove(carte.zoneId, to);
          };

          return (
            <div
              key={carte.id}
              style={{
                ...getGridPlacement(carte.zoneId),
                zIndex: carte.zOrder,
                transform: `translateY(${carte.zOrder * stackOffset(carte.zoneId)}px)`,
              }}
            >
              <motion.div
                layout
                data-zone={carte.zoneId}
                data-card-id={carte.id}
                drag={isDraggable}
                dragMomentum={false}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={1}
                animate={{ x: 0, y: 0, rotate: horizontal ? 90 : 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                whileDrag={{ scale: 1.05, rotate: 0, zIndex: 9999 }}
                onDragEnd={onDragEnd}
                onPointerDown={(e) => {
                  if (canDraw && e.button === 0) onDraw();
                }}
                className={`flex justify-center items-center ${horizontal ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'} ${
                  isDraggable ? 'cursor-grab active:cursor-grabbing' : canDraw ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <Card val={carte.val} symbole={carte.symbole} isFaceDown={carte.isFaceDown} dosCouleur={carte.dosCouleur} />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
