import { motion } from 'framer-motion';
import Card from './Card';

// Éventail de cartes décoratif de la page d'accueil : les cartes s'ouvrent puis flottent doucement.
const FAN = [
  { val: 11, symbole: 'Club', angle: -26, x: -150 },
  { val: 12, symbole: 'Diamond', angle: -13, x: -76 },
  { val: 1, symbole: 'Spade', angle: 0, x: 0 },
  { val: 13, symbole: 'Heart', angle: 13, x: 76 },
  { val: 10, symbole: 'Heart', angle: 26, x: 150 },
];

export default function CardFan() {
  return (
    // Réduit sur mobile pour tenir dans la largeur de l'écran.
    <div className="h-[125px] sm:h-[190px] flex items-end justify-center pointer-events-none select-none" aria-hidden>
      <div className="relative h-[190px] w-[420px] shrink-0 origin-bottom scale-[0.62] sm:scale-100">
      {FAN.map((card, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 bottom-0 -ml-[52px] origin-bottom"
          initial={{ rotate: 0, x: 0, y: 40, opacity: 0 }}
          animate={{ rotate: card.angle, x: card.x, y: [0, -8, 0], opacity: 1 }}
          transition={{
            rotate: { duration: 0.6, ease: 'easeOut', delay: 0.15 + i * 0.07 },
            x: { duration: 0.6, ease: 'easeOut', delay: 0.15 + i * 0.07 },
            opacity: { duration: 0.3, delay: i * 0.07 },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 + i * 0.3 },
          }}
          style={{ zIndex: i === 2 ? 10 : 5 - Math.abs(i - 2) }}
        >
          <Card val={card.val} symbole={card.symbole} isFaceDown={false} dosCouleur="rouge" />
        </motion.div>
      ))}
      </div>
    </div>
  );
}
