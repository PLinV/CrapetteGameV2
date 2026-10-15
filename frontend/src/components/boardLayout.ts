// Position de chaque zone dans la grille du plateau (28 colonnes x 6 lignes), vue du joueur 2.
const PLACEMENTS: Record<string, { gridColumn: number; gridRow: number }> = {
  '11': { gridColumn: 10, gridRow: 1 }, '12': { gridColumn: 14, gridRow: 1 }, '13': { gridColumn: 18, gridRow: 1 },
  '21': { gridColumn: 10, gridRow: 6 }, '22': { gridColumn: 14, gridRow: 6 }, '23': { gridColumn: 18, gridRow: 6 },
  '31': { gridColumn: 8, gridRow: 3 }, '32': { gridColumn: 12, gridRow: 3 }, '33': { gridColumn: 16, gridRow: 3 }, '34': { gridColumn: 20, gridRow: 3 },
  '35': { gridColumn: 8, gridRow: 4 }, '36': { gridColumn: 12, gridRow: 4 }, '37': { gridColumn: 16, gridRow: 4 }, '38': { gridColumn: 20, gridRow: 4 },
  '41': { gridColumn: 2, gridRow: 2 }, '42': { gridColumn: 2, gridRow: 3 }, '43': { gridColumn: 2, gridRow: 4 }, '44': { gridColumn: 2, gridRow: 5 },
  '51': { gridColumn: 24, gridRow: 2 }, '52': { gridColumn: 24, gridRow: 3 }, '53': { gridColumn: 24, gridRow: 4 }, '54': { gridColumn: 24, gridRow: 5 },
};

// `flipped` retourne le plateau de haut en bas, pour que le joueur 1 voie aussi ses cartes en bas de l'écran.
export const getGridPlacement = (zoneId: string, flipped: boolean) => {
  const { gridColumn, gridRow } = PLACEMENTS[zoneId];
  return { gridColumn, gridRow: flipped ? 7 - gridRow : gridRow, placeSelf: 'center' };
};

// Les fondations (4x, 5x) sont couchées sur les côtés du plateau.
export const isHorizontalZone = (zoneId: string) => zoneId.startsWith('4') || zoneId.startsWith('5');

// Décalage vertical entre les cartes empilées au centre : vers le haut pour la rangée du haut, vers le bas pour l'autre.
// Jusqu'à 6 cartes, écart normal. Au-delà, la pile est resserrée pour garder la hauteur d'une pile de 6,
// sans descendre sous l'écart qui laisse lire le chiffre et la couleur (la seule chose qui compte au centre).
// Les autres piles (fondations, crapette, talon, défausse) sont empilées sans décalage.
const STACK_STEP = 50;
const MIN_STACK_STEP = 30;
const MAX_STACK_SPREAD = 5 * STACK_STEP; // hauteur d'une pile de 6 cartes
export const stackOffset = (zoneId: string, gridRow: number, pileSize: number) => {
  if (!zoneId.startsWith('3')) return 0;
  const step = pileSize > 1 ? Math.max(MIN_STACK_STEP, Math.min(STACK_STEP, MAX_STACK_SPREAD / (pileSize - 1))) : STACK_STEP;
  return gridRow === 3 ? -step : step;
};

// Mouvement des cartes : glissement fluide qui ralentit à l'arrivée, sans rebond.
export const CARD_TRANSITION = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 } as const;
