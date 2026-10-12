import { ZONES } from '../../../constant/plateau';

// Position de chaque zone dans la grille du plateau (28 colonnes x 6 lignes).
const PLACEMENTS: Record<string, { gridColumn: number; gridRow: number }> = {
  '11': { gridColumn: 10, gridRow: 1 }, '12': { gridColumn: 14, gridRow: 1 }, '13': { gridColumn: 18, gridRow: 1 },
  '21': { gridColumn: 10, gridRow: 6 }, '22': { gridColumn: 14, gridRow: 6 }, '23': { gridColumn: 18, gridRow: 6 },
  '31': { gridColumn: 8, gridRow: 3 }, '32': { gridColumn: 12, gridRow: 3 }, '33': { gridColumn: 16, gridRow: 3 }, '34': { gridColumn: 20, gridRow: 3 },
  '35': { gridColumn: 8, gridRow: 4 }, '36': { gridColumn: 12, gridRow: 4 }, '37': { gridColumn: 16, gridRow: 4 }, '38': { gridColumn: 20, gridRow: 4 },
  '41': { gridColumn: 2, gridRow: 2 }, '42': { gridColumn: 2, gridRow: 3 }, '43': { gridColumn: 2, gridRow: 4 }, '44': { gridColumn: 2, gridRow: 5 },
  '51': { gridColumn: 24, gridRow: 2 }, '52': { gridColumn: 24, gridRow: 3 }, '53': { gridColumn: 24, gridRow: 4 }, '54': { gridColumn: 24, gridRow: 5 },
};

export const getGridPlacement = (zoneId: string) => ({ ...PLACEMENTS[zoneId], placeSelf: 'center' });

// Les fondations (4x, 5x) sont couchées sur les côtés du plateau.
export const isHorizontalZone = (zoneId: string) => zoneId.startsWith('4') || zoneId.startsWith('5');

// Décalage vertical entre les cartes empilées au centre (vers le haut pour la 1re rangée, vers le bas pour la 2e).
export const stackOffset = (zoneId: string) => {
  if (ZONES.centre.slice(0, 4).includes(zoneId)) return -50;
  if (ZONES.centre.slice(4).includes(zoneId)) return 50;
  return 0;
};
