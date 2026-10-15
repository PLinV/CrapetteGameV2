import type { ReactNode } from 'react';
import BoardCard from './BoardCard';
import CardStack from './CardStack';
import CrapetteButton from './CrapetteButton';
import PlayerPlate from './PlayerPlate';
import { getGridPlacement, isHorizontalZone, stackOffset } from './boardLayout';
import { ZONES_PLATEAU, ZONES, playerZones } from '../../../constant/plateau';
import type { CarteData, PlayerInfo } from '../hooks/useGame';

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
  players: (PlayerInfo | null)[];
  activeSeat: 1 | 2 | null;
  onPassTurn: () => void;
  onBlockedMove: (reason: string) => void; // le joueur touche une carte qu'il ne peut pas jouer pour l'instant
  menu?: ReactNode; // affiché dans le coin en haut à droite du plateau
};

const DRAWN_CARD_FIRST = "Jouez d'abord la carte piochée, ou posez-la sur votre défausse.";
const CRAPETTE_FIRST = "Carte prioritaire jouable";

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
  cartes, selectableZones, isPlayer1, isMyTurn, onDraw, onMove, canCallCrapette, onCrapette, players, activeSeat, onPassTurn, onBlockedMove, menu,
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
      avatarUrl={players[seat - 1]?.avatarUrl ?? null}
      connected={players[seat - 1]?.connected ?? true}
      forfeitDeadline={players[seat - 1]?.forfeitDeadline ?? null}
      isMe={seat === mySeat}
      dos={seat === 1 ? 'rouge' : 'bleu'}
      cardsLeft={cardsLeft(seat)}
      isActive={activeSeat === seat}
      onPassTurn={seat === mySeat ? onPassTurn : undefined}
      style={{ gridColumn: '1 / span 8', gridRow, placeSelf: 'center' }}
    />
  );

  const mine = isPlayer1 ? ZONES.joueur1 : ZONES.joueur2;
  const theirs = isPlayer1 ? ZONES.joueur2 : ZONES.joueur1;
  const myTalon = mine.talon;
  // Carte piochée : retournée sur le talon, elle doit être jouée avant toute autre.
  const myTalonTop = cartes.reduce<CarteData | null>(
    (top, carte) => (carte.zoneId === myTalon && (!top || carte.zOrder > top.zOrder) ? carte : top),
    null,
  );
  const hasDrawnCard = !!myTalonTop && !myTalonTop.isFaceDown;
  // Zones qu'on pourrait jouer sans la carte piochée : y toucher une carte affiche un rappel.
  const blockedZones: string[] = [...ZONES.centre, mine.crapette, mine.defausse, theirs.crapette, theirs.defausse];
  // Raison pour laquelle cette carte ne peut pas être prise maintenant, ou null.
  const blockedReason = (carte: CarteData, isTopCard: boolean): string | null => {
    if (!isMyTurn || !isTopCard || carte.isFaceDown || selectableZones.includes(carte.zoneId)) return null;
    if (hasDrawnCard && blockedZones.includes(carte.zoneId)) return DRAWN_CARD_FIRST;
    // Sa défausse non jouable sans carte piochée : la crapette passe avant.
    if (carte.zoneId === mine.defausse) return CRAPETTE_FIRST;
    return null;
  };
  // Chaque joueur voit ses propres cartes en bas de l'écran.
  const flipped = isPlayer1;

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
          const canDraw = isMyTurn && isTopCard && carte.isFaceDown && carte.zoneId === myTalon;
          const reason = blockedReason(carte, isTopCard);
          const horizontal = isHorizontalZone(carte.zoneId);
          const placement = getGridPlacement(carte.zoneId, flipped);

          // Renvoie true si un coup a été envoyé. Sinon la carte revient à sa place.
          const onDrop = (event: MouseEvent | TouchEvent | PointerEvent) => {
            const to = findZoneAt(event, carte.id);
            if (!to || to === carte.zoneId) return false;
            onMove(carte.zoneId, to);
            return true;
          };

          return (
            <BoardCard
              key={carte.id}
              carte={carte}
              horizontal={horizontal}
              draggable={isDraggable}
              canDraw={canDraw}
              onBlocked={reason ? () => onBlockedMove(reason) : undefined}
              style={{
                ...placement,
                zIndex: carte.zOrder,
                transform: `translateY(${carte.zOrder * stackOffset(carte.zoneId, placement.gridRow, topOrder[carte.zoneId] + 1)}px)`,
              }}
              onDraw={onDraw}
              onDrop={onDrop}
            />
          );
        })}

        {/* Plaques des joueurs dans le coin gauche de leur rangée : l'adversaire en haut, soi en bas. */}
        {plate(opponentSeat, 1)}
        {plate(mySeat, 6)}

        {/* Coin en haut à droite : nom de la table et menu. */}
        {menu && <div style={{ gridColumn: '22 / span 6', gridRow: 1, placeSelf: 'center', width: '100%' }}>{menu}</div>}

        {/* Le bouton est dans le coin droit de la rangée du joueur, en bas. */}
        <CrapetteButton
          enabled={canCallCrapette}
          readyAt={players[mySeat - 1]?.crapetteReadyAt ?? 0}
          onClick={onCrapette}
          style={{ gridColumn: '22 / span 6', gridRow: 6, placeSelf: 'center' }}
        />
      </div>
    </div>
  );
}
