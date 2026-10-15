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

// Nombre de coups pendant lesquels une faute peut encore être sanctionnée par un « Crapette ! ».
const FOUL_MEMORY = 3;
// Délai entre deux « Crapette ! » d'un même joueur, acceptés ou non (contre les appels en rafale).
export const CRAPETTE_COOLDOWN_MS = 10_000;

export type CrapetteCall = 'accepted' | 'refused' | 'cooldown';

export class Board {
  public activePlayer: PlayerNumber;
  // Le premier joueur qui n'a plus de carte dans son jeu (crapette, talon, défausse) gagne.
  public winner: PlayerNumber | null = null;
  // Vrai si la partie a été gagnée parce que l'adversaire n'est pas revenu à temps.
  public wonByForfeit = false;
  // Coups qu'il reste au joueur actif avant que sa dernière faute soit oubliée (0 : pas de faute à sanctionner).
  private foulMovesLeft = 0;
  // Heure (ms) du dernier « Crapette ! » de chaque joueur.
  private lastCrapetteCall: Record<PlayerNumber, number> = { 1: -Infinity, 2: -Infinity };
  private piles = new Map<string, Pack>(ZONES_PLATEAU.map((zoneId) => [zoneId, new Pack()]));

  // Statistiques de la partie, enregistrées dans l'historique à la fin.
  public readonly startedAt = new Date();
  public turns = 1;
  public crapettes: Record<PlayerNumber, number> = { 1: 0, 2: 0 }; // Crapettes réussies par chaque joueur

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
    if (this.winner || !this.piles.has(zoneId) || this.pile(zoneId).isEmpty()) return false;
    const mine = playerZones(this.activePlayer);
    const theirs = playerZones(this.opponent);

    // Carte piochée (retournée sur le talon) : on ne peut jouer qu'elle. Sinon le talon ne se joue pas.
    if (this.hasDrawnCard()) return zoneId === mine.talon;
    // La crapette est prioritaire sur la défausse, sauf pour monter la carte de la défausse aux fondations.
    if (zoneId === mine.defausse) return !this.crapetteHasMove() || this.canGoUpFrom(zoneId);
    return isCentre(zoneId) || zoneId === mine.crapette || zoneId === theirs.defausse || zoneId === theirs.crapette;
  }

  public canPlace(card: Card, from: string, to: string): boolean {
    if (from === to || !this.piles.has(to)) return false;
    const target = this.pile(to).top();
    const mine = playerZones(this.activePlayer);
    const theirs = playerZones(this.opponent);

    // Fondations : As sur une place vide, puis +1 de la même couleur (enseigne).
    if (isFondation(to)) {
      return target ? card.symbole === target.symbole && card.val === target.val + 1 : card.val === 1;
    }

    // Une carte prise à l'adversaire doit obligatoirement monter aux fondations.
    if (from === theirs.defausse || from === theirs.crapette) return false;

    // Crapette jouable : la défausse ne peut que monter aux fondations.
    if (from === mine.defausse && this.crapetteHasMove()) return false;

    // Sa propre défausse ne reçoit que la carte piochée qu'on n'a pas pu jouer.
    if (to === mine.defausse) return from === mine.talon;

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

  private canGoUpFrom(from: string): boolean {
    const card = this.pile(from).top();
    return !!card && ZONES.fondations.some((to) => this.canPlace(card, from, to));
  }

  // Vrai si la carte du dessus de la crapette du joueur actif peut être jouée : elle passe avant le talon et la défausse.
  public crapetteHasMove(): boolean {
    const from = playerZones(this.activePlayer).crapette;
    const card = this.pile(from).top();
    return !!card && ZONES_PLATEAU.some((to) => this.canPlace(card, from, to));
  }

  public move(from: string, to: string): boolean {
    if (!this.canTakeFrom(from)) return false;
    const card = this.pile(from).top()!;
    if (!this.canPlace(card, from, to)) return false;

    this.recordAction(!isFondation(to) && this.canGoUp());
    this.pile(to).add(this.pile(from).take()!);
    // Retourne la carte suivante d'une crapette. Celle du talon reste cachée jusqu'à la prochaine pioche.
    if (from !== playerZones(this.activePlayer).talon) {
      const next = this.pile(from).top();
      if (next) next.isFaceDown = false;
    }
    this.checkWinner();
    // Carte piochée posée sur sa défausse : elle n'a pas pu être jouée, le tour passe.
    if (to === playerZones(this.activePlayer).defausse && !this.winner) this.passTurn();
    return true;
  }

  // Un joueur gagne quand sa crapette, son talon et sa défausse sont vides.
  // On regarde aussi l'adversaire : on peut lui prendre sa dernière carte pour la monter aux fondations.
  private checkWinner() {
    for (const player of [this.activePlayer, this.opponent]) {
      const { crapette, talon, defausse } = playerZones(player);
      if ([crapette, talon, defausse].every((zoneId) => this.pile(zoneId).isEmpty())) {
        this.winner = player;
        return;
      }
    }
  }

  // Pioche : retourne la carte du dessus du talon. Elle doit être jouée (ou défaussée) avant toute autre carte,
  // et on ne peut pas en retourner une autre tant qu'elle est là.
  public draw(): boolean {
    const top = this.pile(playerZones(this.activePlayer).talon).top();
    if (this.winner || !top || !top.isFaceDown || this.crapetteHasMove()) return false;

    this.recordAction(this.canGoUp());
    top.isFaceDown = false;
    return true;
  }

  // Talon vide : la défausse est retournée d'un bloc pour refaire un talon (la première carte défaussée
  // devient la prochaine à piocher). Le tour continue. Mêmes règles que pour piocher : refusé si la crapette
  // peut être jouée, et faute si une carte pouvait monter aux fondations.
  public recycle(): boolean {
    const { talon, defausse } = playerZones(this.activePlayer);
    if (this.winner || !this.pile(talon).isEmpty() || this.pile(defausse).isEmpty() || this.crapetteHasMove()) return false;

    this.recordAction(this.canGoUp());
    const cards = this.pile(defausse).cartes.splice(0); // du dessous au dessus
    for (const card of cards.reverse()) this.pile(talon).add(card, true);
    return true;
  }

  // Vrai si le joueur actif a retourné une carte de son talon sans l'avoir encore jouée.
  public hasDrawnCard(): boolean {
    const top = this.pile(playerZones(this.activePlayer).talon).top();
    return !!top && !top.isFaceDown;
  }

  // Fin du tour : une carte piochée et pas jouée va sur la défausse.
  public passTurn() {
    this.discardHand();
    this.turns++;
    this.activePlayer = this.opponent;
    this.foulMovesLeft = 0; // passer son tour efface la faute
  }

  private discardHand() {
    if (!this.hasDrawnCard()) return;
    const { talon, defausse } = playerZones(this.activePlayer);
    this.pile(defausse).add(this.pile(talon).take()!);
  }

  // Une faute reste sanctionnable pendant les FOUL_MEMORY coups (déplacement ou pioche) qui la suivent,
  // même si la carte oubliée est montée entre-temps. Une nouvelle faute relance le compteur.
  private recordAction(isFoul: boolean) {
    if (isFoul) this.foulMovesLeft = FOUL_MEMORY;
    else if (this.foulMovesLeft > 0) this.foulMovesLeft--;
  }

  // Faute : le joueur pouvait monter une carte aux fondations et a fait autre chose.
  private canGoUp(): boolean {
    return this.selectableZones().some((from) => {
      const card = this.pile(from).top()!;
      return ZONES.fondations.some((to) => this.canPlace(card, from, to));
    });
  }

  // Temps (ms) avant que ce joueur puisse de nouveau crier « Crapette ! ».
  public crapetteCooldownMs(player: PlayerNumber, now = Date.now()): number {
    return Math.max(0, this.lastCrapetteCall[player] + CRAPETTE_COOLDOWN_MS - now);
  }

  // L'adversaire du joueur actif crie « Crapette ! » : s'il y a une faute encore en mémoire, le tour lui revient.
  public callCrapette(caller: PlayerNumber, now = Date.now()): CrapetteCall {
    if (this.crapetteCooldownMs(caller, now) > 0) return 'cooldown';
    if (this.winner) return 'refused';
    this.lastCrapetteCall[caller] = now;
    if (this.foulMovesLeft === 0) return 'refused';
    this.crapettes[this.opponent]++;
    this.passTurn();
    return 'accepted';
  }


  // Le joueur est parti trop longtemps : son adversaire gagne.
  public forfeit(loser: PlayerNumber) {
    if (this.winner) return;
    this.winner = loser === 1 ? 2 : 1;
    this.wonByForfeit = true;
  }

  // ----- Outils admin, pour tester la partie -----

  // Ne laisse au joueur qu'une carte, sur sa crapette, prête à monter aux fondations :
  // il gagne en un coup. Ses autres cartes sont retirées du jeu.
  public adminNearlyWin(player: PlayerNumber) {
    this.adminGiveTurn(player);
    this.winner = null;
    const { crapette, talon, defausse } = playerZones(player);
    const cartes = [crapette, talon, defausse].flatMap((zoneId) => this.pile(zoneId).cartes.splice(0));
    const last = cartes.find((card) => ZONES.fondations.some((to) => this.canPlace(card, crapette, to))) ?? cartes[0];
    if (last) this.pile(crapette).add(last);
  }

  public adminGiveTurn(player: PlayerNumber) {
    this.discardHand();
    this.activePlayer = player;
    this.foulMovesLeft = 0;
  }

  // Vide le talon du joueur sur sa défausse (cartes visibles) : pour tester le bouton ♻️.
  public adminEmptyTalon(player: PlayerNumber) {
    const { talon, defausse } = playerZones(player);
    const cartes = this.pile(talon).cartes.splice(0);
    for (const card of cartes.reverse()) this.pile(defausse).add(card); // comme si on les avait piochées une à une
  }

  public adminForceWin(player: PlayerNumber) {
    this.winner = player;
  }

  // Cartes qu'il reste au joueur (crapette, talon, défausse) : 0 pour le gagnant.
  public cardsLeft(player: PlayerNumber): number {
    const { crapette, talon, defausse } = playerZones(player);
    return [crapette, talon, defausse].reduce((total, zoneId) => total + this.pile(zoneId).cartes.length, 0);
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
