import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import Card from './Card';
import { CARD_TRANSITION } from './boardLayout';
import type { CarteData } from '../hooks/useGame';

// Sans réponse du serveur après ce délai (coupure réseau...), la carte lâchée revient à sa place.
const NO_ANSWER_MS = 1500;
// Une fois revenue à 0, la carte reste encore un peu au premier plan, le temps de finir son glissement.
const LANDING_MS = 1000 * CARD_TRANSITION.duration + 100;
const LIFTED_Z_INDEX = '1000';

type BoardCardProps = {
  carte: CarteData;
  horizontal: boolean; // fondations : carte couchée
  draggable: boolean;
  canDraw: boolean;
  onBlocked?: () => void; // carte qu'on ne peut pas jouer pour l'instant : au clic, on prévient le joueur
  style: CSSProperties; // placement dans la grille du plateau
  onDraw: () => void;
  // Appelé au lâcher : renvoie true si un coup a été envoyé au serveur.
  onDrop: (event: MouseEvent | TouchEvent | PointerEvent) => boolean;
};

// Carte du plateau. Lâchée sur une autre zone, elle reste où on l'a posée jusqu'à la réponse du serveur :
// si le coup est accepté, elle glisse de là jusqu'à sa nouvelle place (le décalage x/y revient à 0 pendant
// que l'animation `layout` la déplace d'une place à l'autre, d'où une trajectoire droite) ; sinon elle revient.
export default function BoardCard({ carte, horizontal, draggable, canDraw, onBlocked, style, onDraw, onDrop }: BoardCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragging = useRef(false);
  const noAnswerTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const landingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Carte en main ou en train d'atterrir : elle passe au-dessus de toutes les autres. Le z-index est
  // changé directement sur l'élément : passer par un état React redessinerait tout le plateau au moment
  // où on prend la carte (et framer-motion remesurerait les 104 cartes), d'où un petit à-coup.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lifted = useRef(false);
  const baseZIndex = useRef(String(style.zIndex ?? ''));
  useLayoutEffect(() => {
    baseZIndex.current = String(style.zIndex ?? '');
    // React vient peut-être de remettre le z-index de base (nouvel état reçu pendant le glissement).
    if (lifted.current && wrapperRef.current) wrapperRef.current.style.zIndex = LIFTED_Z_INDEX;
  });
  const lift = () => {
    clearTimeout(landingTimer.current);
    lifted.current = true;
    if (wrapperRef.current) wrapperRef.current.style.zIndex = LIFTED_Z_INDEX;
  };
  const land = useCallback(() => {
    clearTimeout(landingTimer.current);
    landingTimer.current = setTimeout(() => {
      lifted.current = false;
      if (wrapperRef.current) wrapperRef.current.style.zIndex = baseZIndex.current;
    }, LANDING_MS);
  }, []);

  const settle = useCallback(() => {
    clearTimeout(noAnswerTimer.current);
    animate(x, 0, CARD_TRANSITION);
    animate(y, 0, CARD_TRANSITION);
    if (lifted.current) land();
  }, [x, y, land]);

  // Chaque état reçu du serveur crée de nouveaux objets carte : la carte posée rejoint alors sa place.
  useEffect(() => {
    if (!dragging.current) settle();
  }, [carte, settle]);
  useEffect(
    () => () => {
      clearTimeout(noAnswerTimer.current);
      clearTimeout(landingTimer.current);
    },
    [],
  );

  return (
    <div ref={wrapperRef} style={style}>
      <motion.div
        layout
        data-zone={carte.zoneId}
        data-card-id={carte.id}
        drag={draggable}
        dragMomentum={false}
        style={{ x, y }}
        animate={{ rotate: horizontal ? 90 : 0, scale: 1 }}
        transition={CARD_TRANSITION}
        whileDrag={{ scale: 1.05, rotate: 0 }}
        onDragStart={() => {
          dragging.current = true;
          clearTimeout(noAnswerTimer.current);
          lift();
        }}
        onDragEnd={(event) => {
          dragging.current = false;
          if (onDrop(event)) noAnswerTimer.current = setTimeout(settle, NO_ANSWER_MS);
          else settle();
        }}
        onPointerDown={(e: ReactPointerEvent) => {
          if (e.button !== 0) return;
          if (canDraw) onDraw();
          else onBlocked?.();
        }}
        className={`flex justify-center items-center ${horizontal ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'} ${
          draggable ? 'cursor-grab active:cursor-grabbing' : canDraw ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        <Card val={carte.val} symbole={carte.symbole} isFaceDown={carte.isFaceDown} dosCouleur={carte.dosCouleur} />
      </motion.div>
    </div>
  );
}
