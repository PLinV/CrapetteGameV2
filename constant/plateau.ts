// Zones du plateau, partagées entre le frontend et le backend.
// Le premier chiffre donne le groupe, le second la position dans le groupe.
export const ZONES = {
  joueur1: { defausse: '11', talon: '12', crapette: '13' }, // haut
  joueur2: { defausse: '21', talon: '22', crapette: '23' }, // bas
  centre: ['31', '32', '33', '34', '35', '36', '37', '38'],
  fondations: ['41', '42', '43', '44', '51', '52', '53', '54'], // As -> Roi
};

export type PlayerNumber = 1 | 2;

export const ZONES_PLATEAU = [
  ...Object.values(ZONES.joueur1),
  ...Object.values(ZONES.joueur2),
  ...ZONES.centre,
  ...ZONES.fondations,
];

export const playerZones = (player: PlayerNumber) => (player === 1 ? ZONES.joueur1 : ZONES.joueur2);

export const isFondation = (zoneId: string) => ZONES.fondations.includes(zoneId);
export const isCentre = (zoneId: string) => ZONES.centre.includes(zoneId);
