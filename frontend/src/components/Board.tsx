import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import CardStack from './CardStack';
import CrapetteButton from './CrapetteButton';
import PlayerPlate from './PlayerPlate';
import { getGridPlacement, isHorizontalZone, stackOffset } from './boardLayout';
import { ZONES_PLATEAU, ZONES, playerZones } from '../../../constant/plateau';
import type { CarteData } from '../hooks/useGame';

type BoardProps = {
  cartes: CarteData[];
  selectableZones: string[];
  isPlayer1: boolean;
  isMyTurn: boolean;
  onDraw: () => void;
  onMove: (from: string, to: string) => void;
  canCallCrapette: boolean;
  onCrapette: () => void;
  // Pseudos des joueurs, par numéro de joueur, et joueur dont c'est le tour (null si la partie est finie).
  players: ({ username: string } | null)[];
  activeSeat: 1 | 2 | null;
  onPassTurn: () => void;
};

// Ressort sans rebond (amortissement critique : damping = 2 * √stiffness), utilisé à la fois pour le retour
// de la carte lâchée et pour son déplacement vers sa nouvelle place : les deux mouvements s'additionnent
// en une trajectoire droite, du point de lâcher jusqu'à la destination.
const STIFFNESS = 400;
const DAMPING = 40;
const CARD_TRANSITION = { type: 'spring', stiffness: STIFFNESS, damping: DAMPING } as const;
// Durée pendant laquelle la carte lâchée reste au premier plan, le temps d'arriver à sa place.
const LANDING_MS = 400;

// Zone (emplacement vide ou carte) sous le pointeur, en ignorant la carte qu'on déplace.
const findZoneAt = (event: MouseEvent | TouchEvent | PointerEvent, draggedId: string) => {
  const point = 'changedTouches' in event ? event.changedTouches[0] : event;
  for (const el of document.elementsFromPoint(point.clientX, point.clientY)) {
    const zone = el.closest<HTMLElement>('[data-zone]');
    if (zone && zone.dataset.cardId !== draggedId) return zone.dataset.zone;
  }
  return undefined;
};

export default function Board({
  cartes, selectableZones, isPlayer1, isMyTurn, onDraw, onMove, canCallCrapette, onCrapette, players, activeSeat, onPassTurn,
}: BoardProps) {
  const mySeat = isPlayer1 ? 1 : 2;
  const opponentSeat = isPlayer1 ? 2 : 1;
  // Cartes qu'il reste à un joueur pour gagner : crapette, talon et défausse.
  const cardsLeft = (seat: 1 | 2) => {
    const zones: string[] = Object.values(playerZones(seat));
    return cartes.filter((carte) => zones.includes(carte.zoneId)).length;
  };
  const plate = (seat: 1 | 2, gridRow: number) => (
    <PlayerPlate
      username={players[seat - 1]?.username ?? null}
      isMe={seat === mySeat}
      dos={seat === 1 ? 'rouge' : 'bleu'}
      cardsLeft={cardsLeft(seat)}
      isActive={activeSeat === seat}
      onPassTurn={seat === mySeat ? onPassTurn : undefined}
      style={{ gridColumn: '1 / span 8', gridRow, placeSelf: 'center' }}
    />
  );

  const myTalon = isPlayer1 ? ZONES.joueur1.talon : ZONES.joueur2.talon;
  // Chaque joueur voit ses propres cartes en bas de l'écran.
  const flipped = isPlayer1;

  // Carte en main ou en train d'atterrir : elle passe au-dessus de toutes les autres.
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const landingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lift = (id: string) => {
    clearTimeout(landingTimer.current);
    setLiftedId(id);
  };
  const land = () => {
    landingTimer.current = setTimeout(() => setLiftedId(null), LANDING_MS);
  };

  const topOrder: Record<string, number> = {};
  for (const carte of cartes) topOrder[carte.zoneId] = Math.max(topOrder[carte.zoneId] ?? -1, carte.zOrder);

  return (
    <div className="relative p-[60px_80px] bg-[radial-gradient(circle,_#2a723f_0%,_#113a1e_100%)] border-[18px] border-[#3e2723] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.8),_inset_0_0_40px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-1 border-3 border-[#d4af37] rounded-[20px] pointer-events-none shadow-[0_0_10px_rgba(212,175,55,0.4)]" />

      <div className="grid grid-cols-[repeat(28,32px)] grid-rows-[repeat(6,160px)] gap-[15px]">
        {ZONES_PLATEAU.map((zoneId) => (
          <CardStack key={zoneId} zoneId={zoneId} flipped={flipped} />
        ))}

        {cartes.map((carte) => {
          const isTopCard = carte.zOrder === topOrder[carte.zoneId];
          const isDraggable = isMyTurn && isTopCard && !carte.isFaceDown && selectableZones.includes(carte.zoneId);
          const canDraw = isMyTurn && isTopCard && carte.zoneId === myTalon;
          const horizontal = isHorizontalZone(carte.zoneId);
          const placement = getGridPlacement(carte.zoneId, flipped);

          const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent) => {
            land();
            const to = findZoneAt(event, carte.id);
            // Sinon la carte revient toute seule à sa place.
            if (to && to !== carte.zoneId) onMove(carte.zoneId, to);
          };

          return (
            <div
              key={carte.id}
              style={{
                ...placement,
                zIndex: carte.id === liftedId ? 1000 : carte.zOrder,
                transform: `translateY(${carte.zOrder * stackOffset(placement.gridRow)}px)`,
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
                dragTransition={{ bounceStiffness: STIFFNESS, bounceDamping: DAMPING }}
                animate={{ x: 0, y: 0, rotate: horizontal ? 90 : 0, scale: 1 }}
                transition={CARD_TRANSITION}
                whileDrag={{ scale: 1.05, rotate: 0 }}
                onDragStart={() => lift(carte.id)}
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

        {/* Plaques des joueurs dans le coin gauche de leur rangée : l'adversaire en haut, soi en bas. */}
        {plate(opponentSeat, 1)}
        {plate(mySeat, 6)}

        {/* Le bouton est dans le coin droit de la rangée du joueur, en bas. */}
        <CrapetteButton
          enabled={canCallCrapette}
          onClick={onCrapette}
          style={{ gridColumn: '22 / span 6', gridRow: 6, placeSelf: 'center' }}
        />
      </div>
    </div>
  );
}
