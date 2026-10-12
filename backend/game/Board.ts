import { Card, DosCouleur, Symbole } from './Card';
import { Pack } from './Pack';
import {
  ZONES, ZONES_PLATEAU, PlayerNumber, playerZones, isCentre, isFondation,
} from '../../constant/plateau';

const SYMBOLES: Symbole[] = ['Spade', 'Club', 'Diamond', 'Heart'];

// Carte envoyée au client : la valeur des cartes face cachée n'est pas transmise.
export type ClientCard = {
  id: string;
  zoneId: string;
  zOrder: number;
  isFaceDown: boolean;
  dosCouleur: DosCouleur;
  val?: number;
  symbole?: Symbole;
};

export class Board {
  public activePlayer: PlayerNumber;
  // Après une pioche, il faut jouer la carte de sa défausse avant de pouvoir repiocher.
  private canDraw = true;
  // Vrai si la dernière action du joueur actif est une faute que l'adversaire peut sanctionner.
  private lastActionWasFoul = false;
  private piles = new Map<string, Pack>(ZONES_PLATEAU.map((zoneId) => [zoneId, new Pack()]));

  constructor() {
    this.deal(1, ZONES.centre.slice(0, 4), 'rouge');
    this.deal(2, ZONES.centre.slice(4), 'bleu');
    this.activePlayer = this.whoBegins();
  }

  private pile(zoneId: string): Pack {
    return this.piles.get(zoneId)!;
  }

  private get opponent(): PlayerNumber {
    return this.activePlayer === 1 ? 2 : 1;
  }

  // 4 cartes au centre, 13 dans la crapette (seule celle du dessus est visible), le reste au talon.
  private deal(player: PlayerNumber, centreZones: string[], dos: DosCouleur) {
    const valeurs = SYMBOLES.flatMap((symbole) =>
      Array.from({ length: 13 }, (_, i) => ({ symbole, val: i + 1 })),
    );
    shuffle(valeurs);
    // Les id sont donnés après le mélange pour ne rien révéler des cartes cachées.
    const deck = valeurs.map(({ symbole, val }, i) => new Card(`p${player}-${i}`, val, symbole, dos));

    const { crapette, talon } = playerZones(player);
    for (const zoneId of centreZones) this.pile(zoneId).add(deck.pop()!);
    for (let i = 0; i < 13; i++) this.pile(crapette).add(deck.pop()!, true);
    this.pile(crapette).top()!.isFaceDown = false;
    while (deck.length > 0) this.pile(talon).add(deck.pop()!, true);
  }

  // Celui qui a la plus forte carte en haut de sa crapette commence (puis la suivante en cas d'égalité).
  private whoBegins(): PlayerNumber {
    const c1 = this.pile(ZONES.joueur1.crapette).cartes;
    const c2 = this.pile(ZONES.joueur2.crapette).cartes;
    for (let i = 1; i <= 2; i++) {
      const v1 = c1[c1.length - i].val;
      const v2 = c2[c2.length - i].val;
      if (v1 !== v2) return v1 > v2 ? 1 : 2;
    }
    return 1;
  }

  // Zones dont le joueur actif peut prendre la carte du dessus.
  public canTakeFrom(zoneId: string): boolean {
    if (!this.piles.has(zoneId) || this.pile(zoneId).isEmpty()) return false;
    const mine = playerZones(this.activePlayer);
    const theirs = playerZones(this.opponent);

    if (zoneId === mine.defausse) return !this.crapetteHasMove(); // la crapette est prioritaire
    return isCentre(zoneId) || zoneId === mine.crapette || zoneId === theirs.defausse || zoneId === theirs.crapette;
  }

  public canPlace(card: Card, from: string, to: string): boolean {
    if (from === to || !this.piles.has(to)) return false;
    const target = this.pile(to).top();
    const theirs = playerZones(this.opponent);

    // Fondations : As sur une place vide, puis +1 de la même couleur (enseigne).
    if (isFondation(to)) {
      return target ? card.symbole === target.symbole && card.val === target.val + 1 : card.val === 1;
    }

    // Une carte prise à l'adversaire doit obligatoirement monter aux fondations.
    if (from === theirs.defausse || from === theirs.crapette) return false;

    // Centre : n'importe quelle carte sur une place vide, sinon -1 en alternant rouge/noir.
    if (isCentre(to)) {
      return !target || (card.val === target.val - 1 && card.couleur !== target.couleur);
    }

    // Chez l'adversaire : +1 ou -1 de la même enseigne.
    if (to === theirs.defausse || to === theirs.crapette) {
      return !!target && card.symbole === target.symbole && Math.abs(card.val - target.val) === 1;
    }

    return false;
  }

  private crapetteHasMove(): boolean {
    const from = playerZones(this.activePlayer).crapette;
    const card = this.pile(from).top();
    return !!card && ZONES_PLATEAU.some((to) => this.canPlace(card, from, to));
  }

  public move(from: string, to: string): boolean {
    if (!this.canTakeFrom(from)) return false;
    const card = this.pile(from).top()!;
    if (!this.canPlace(card, from, to)) return false;

    this.lastActionWasFoul = !isFondation(to) && this.canGoUp();
    this.pile(to).add(this.pile(from).take()!);
    const newTop = this.pile(from).top();
    if (newTop) newTop.isFaceDown = false; // retourne la carte suivante de la crapette
    // On ne peut repiocher qu'après avoir joué la carte piochée, posée sur la défausse.
    if (from === playerZones(this.activePlayer).defausse) this.canDraw = true;
    return true;
  }

  // Retourne la carte du talon sur la défausse.
  public draw(): boolean {
    const { talon, defausse } = playerZones(this.activePlayer);
    if (!this.canDraw || this.pile(talon).isEmpty()) return false;

    this.lastActionWasFoul = this.canGoUp();
    this.pile(defausse).add(this.pile(talon).take()!);
    this.canDraw = false;
    return true;
  }

  public passTurn() {
    this.activePlayer = this.opponent;
    this.canDraw = true;
    this.lastActionWasFoul = false;
  }

  // Faute : le joueur pouvait monter une carte aux fondations et a fait autre chose.
  private canGoUp(): boolean {
    return this.selectableZones().some((from) => {
      const card = this.pile(from).top()!;
      return ZONES.fondations.some((to) => this.canPlace(card, from, to));
    });
  }

  // L'adversaire crie « Crapette ! » : si la dernière action était une faute, le tour lui revient.
  public callCrapette(): boolean {
    if (!this.lastActionWasFoul) return false;
    this.passTurn();
    return true;
  }

  public selectableZones(): string[] {
    return ZONES_PLATEAU.filter((zoneId) => this.canTakeFrom(zoneId));
  }

  public clientCards(): ClientCard[] {
    return [...this.piles].flatMap(([zoneId, pack]) =>
      pack.cartes.map((card, zOrder) => ({
        id: card.id,
        zoneId,
        zOrder,
        isFaceDown: card.isFaceDown,
        dosCouleur: card.dosCouleur,
        ...(card.isFaceDown ? {} : { val: card.val, symbole: card.symbole }),
      })),
    );
  }
}

function shuffle<T>(array: T[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
