import { getGridPlacement, isHorizontalZone } from './boardLayout';

// Emplacement vide d'une zone. `data-zone` permet de la retrouver au moment du dépôt.
export default function CardStack({ zoneId }: { zoneId: string }) {
  return (
    <div
      data-zone={zoneId}
      className={`bg-black/20 border-2 border-dashed border-[#d4af37]/30 rounded-lg ${
        isHorizontalZone(zoneId) ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'
      }`}
      style={getGridPlacement(zoneId)}
    />
  );
}
