import { Player } from './Player';
import { Card } from './Card';
import { Pack } from './Pack';

export class Board {
  
  static ZONES_LIST = [
    '11','12','13', '21','22','23', 
    '31','32','33','34','35','36','37','38', 
    '41','42','43','44', '51','52','53','54'
  ];

  static ZONES_DICT = {
    '1': ['11', '12', '13'], // client Haut
    '2': ['21', '22', '23'], // client Bas
    '3': ['31', '32', '33', '34', '35', '36', '37', '38'], // centre 
    '4': ['41', '42', '43', '44'], // côté Gauche
    '5': ['51', '52', '53', '54']  // côté Droit
  };

  static SYMBOLS = ["Spade", "Club", "Diamond", "Heart"];

  public p1: Player;
  public p2: Player;
  public activePlayer: number; // 0 (avant début), 1, ou 2
  public selectedCard: [Card | null, string | null]; // [carte, zoneId]
  
  public slots: Map<string, Pack>;

  // --- VARIABLES DE RÈGLES ---
  public countSlot12or22: number;
  public countCrapette: number;
  public lastMoveCard: Card | null;
  public lastMoveSlot: string | null;
  public lastBoard: Record<string, Pack>;
  public crapetteSources: Record<string, Card | null>;

  constructor(p1SocketId: string, p2SocketId: string) {
    this.p1 = new Player(1, '', p1SocketId);
    this.p2 = new Player(2, '', p2SocketId);
    
    this.activePlayer = 0;
    this.selectedCard = [null, null];
    
    this.countSlot12or22 = 0;
    this.countCrapette = 1;
    this.lastMoveCard = null;
    this.lastMoveSlot = null;
    this.lastBoard = {};

    this.crapetteSources = {
      '41': null, '42': null, '43': null, '44': null,  
      '51': null, '52': null, '53': null, '54': null
    };

    this.slots = new Map<string, Pack>();
    this.initEmptyBoard();
  }

  private initEmptyBoard() {
    Board.ZONES_LIST.forEach((zoneId) => {
      this.slots.set(zoneId, new Pack(zoneId));
    });

    this.slots.set('61', new Pack('61'));
    this.slots.set('62', new Pack('62'));
  }

  public getPack(zoneId: string): Pack | undefined {
    return this.slots.get(zoneId);
  }

  public initGame() {
    const pack61 = this.slots.get('61')!;
    const pack62 = this.slots.get('62')!;

    let idCounter = 1;

    Board.SYMBOLS.forEach(sym => {
      for (let i = 1; i <= 13; i++) {
        const stringVal = i.toString(); 
        pack61.addCard(new Card(`p1-card-${idCounter}`, stringVal, sym, 'rouge'));
        pack62.addCard(new Card(`p2-card-${idCounter}`, stringVal, sym, 'bleu'));
        idCounter++;
      }
    });

    pack61.shuffle();
    pack62.shuffle();

    const moveCardInit = (sourceId: string, targetId: string, faceDown: boolean = true) => {
      const sourcePack = this.slots.get(sourceId);
      const targetPack = this.slots.get(targetId);
      if (sourcePack && targetPack && !sourcePack.isEmpty()) {
        const card = sourcePack.takeCard()!;
        targetPack.addCard(card, faceDown); // 
      }
    };

    for (let i = 1; i <= 4; i++) {
      moveCardInit('61', (30 + i).toString(), false); 
    }
    for (let i = 1; i <= 13; i++) {
      const isTopCard = (i === 13);
      moveCardInit('61', '13', !isTopCard); 
    }
    while (!pack61.isEmpty()) {
      moveCardInit('61', '12', true);
    }

    for (let i = 1; i <= 4; i++) {
      moveCardInit('62', (34 + i).toString(), false); 
    }
    for (let i = 1; i <= 13; i++) {
      const isTopCard = (i === 13);
      moveCardInit('62', '23', !isTopCard); 
    }
    while (!pack62.isEmpty()) {
      moveCardInit('62', '22', true); 
    }

    this.lastMoveCard = null;
    this.lastMoveSlot = null;
    this.countCrapette = 1;

    const crapetteP1 = this.slots.get('13');
    if (crapetteP1 && !crapetteP1.isEmpty()) {
      crapetteP1.getCard()!.isFaceDown = false;
    }

    const crapetteP2 = this.slots.get('23');
    if (crapetteP2 && !crapetteP2.isEmpty()) {
      crapetteP2.getCard()!.isFaceDown = false;
    }
  }

  public whoBegins() {
    const pack13 = this.slots.get('13');
    const pack23 = this.slots.get('23');

    // si les paquets ne sont pas encore créés ou vides, le J1 commence
    if (!pack13 || !pack23 || pack13.isEmpty() || pack23.isEmpty()) {
      this.activePlayer = 1;
      console.log("Player 1 begin (sécurité)");
      return;
    }

    // on convertit directement la chaîne "13" en nombre 13
    const val1 = parseInt(pack13.getCard()?.val || '0');
    const val2 = parseInt(pack23.getCard()?.val || '0');

    if (val1 > val2) {
      this.activePlayer = 1;
      console.log("Player 1 begin");
      
    } else if (val1 < val2) {
      this.activePlayer = 2;
      console.log("Player 2 begin");
      
    } else {
      // on regarde la carte juste en dessous (index length - 2)
      const subCard1 = pack13.cartes.length >= 2 ? pack13.cartes[pack13.cartes.length - 2] : undefined;
      const subCard2 = pack23.cartes.length >= 2 ? pack23.cartes[pack23.cartes.length - 2] : undefined;

      const subVal1 = parseInt(subCard1?.val || '0');
      const subVal2 = parseInt(subCard2?.val || '0');

      if (subVal1 > subVal2) {
        this.activePlayer = 1;
        console.log("Player 1 begin");
      } else if (subVal1 < subVal2) {
        this.activePlayer = 2;
        console.log("Player 2 begin");
      } else {
        this.activePlayer = 1;
        console.log("Player 1 begin, 2 times same num !");
      }
    }
  }

  public canPlayPriorityCard(): boolean {
    if (this.selectedCard[0] !== null) {
      console.log("Une carte est déjà sélectionnée.");
      return false; 
    }

    // on détermine la zone prioritaire (Crapette du joueur actif)
    const prioritySlotId = (this.activePlayer === 1) ? '13' : '23';
    const priorityPack = this.slots.get(prioritySlotId);

    // si le paquet n'existe pas ou que la Crapette est vide, il n'y a pas de carte prioritaire
    if (!priorityPack || priorityPack.isEmpty()) {
      return false;
    }

    const priorityCard = priorityPack.getCard()!;

    // on "simule" la sélection de la carte prioritaire
    this.selectedCard = [priorityCard, prioritySlotId];

    // on teste toutes les zones du plateau pour voir si un coup est valide
    for (const slotId of Board.ZONES_LIST) {
      // on ne teste évidemment pas la zone où la carte se trouve déjà
      if (slotId !== prioritySlotId && this.isPlayable(slotId, false)) {
        // on a trouvé un coup valide ! On efface nos traces et on renvoie true
        this.selectedCard = [null, null];
        return true;
      }
    }
    
    // si on arrive ici, c'est qu'aucun coup n'est possible. On efface nos traces.
    this.selectedCard = [null, null];
    return false;
  }

  public isSelectable(zoneId: string): boolean {
    if (this.activePlayer === 0) {
      return false;
    }

    if (this.selectedCard[0] !== null && this.selectedCard[1] !== null) {
      return false;
    }

    if (!Board.ZONES_LIST.includes(zoneId) && !['61', '62'].includes(zoneId)) {
      return false;
    }

    const myDiscardSlot = (this.activePlayer === 1) ? '11' : '21';
    if (zoneId === myDiscardSlot && this.canPlayPriorityCard()) {
      console.log("Action refusée : Vous devez d'abord jouer votre carte Crapette !");
      return false;
    }

    const opponentDrawPile = (this.activePlayer === 1) ? '22' : '12';
    if (zoneId === opponentDrawPile) {
        console.log("Action refusée : Pioche adverse intouchable.");
        return false;
    }

    // Zones impossibles à sélectionner (As, Pioches perso)
    const isZone4 = Board.ZONES_DICT['4'].includes(zoneId);
    const isZone5 = Board.ZONES_DICT['5'].includes(zoneId);
    const isMyDrawPile = ['12', '22'].includes(zoneId);
    const isInitZone = ['61', '62'].includes(zoneId);

    if (isZone4 || isZone5 || isMyDrawPile || isInitZone) {
      return false;
    }

    const pack = this.slots.get(zoneId);
    if (!pack || pack.isEmpty()) {
      return false;
    }

    return true; 
  }

  public isPlayable(zoneIdCible: string, verbose = true): boolean {
    const selectedCard = this.selectedCard[0];
    
    if (!selectedCard) {
      if (verbose) console.log("Aucune carte n'est sélectionnée.");
      return false;
    }

    const adverseCards = (this.activePlayer === 1) ? ['21', '23'] : ['11', '13'];
    const targetPack = this.slots.get(zoneIdCible);
    const coverCard = targetPack?.getCard();
    
    const selectedNum = parseInt(selectedCard.val);
    const coverNum = coverCard ? parseInt(coverCard.val) : 0;

    const isZone4 = Board.ZONES_DICT['4'].includes(zoneIdCible);
    const isZone5 = Board.ZONES_DICT['5'].includes(zoneIdCible);
    const isZone3 = Board.ZONES_DICT['3'].includes(zoneIdCible);

    if (isZone4 || isZone5) {
      if (!coverCard) {
        if (selectedNum === 1) return true;
        if (verbose) console.log("La place est vide, il faut un As (1).");
        return false;
      }
      // Sinon, il faut +1
      if (selectedNum !== coverNum + 1) {
        if (verbose) console.log("Il faut que ce soit +1.");
        return false;
      }
      // Et le même symbole
      if (selectedCard.symbole !== coverCard.symbole) {
        if (verbose) console.log("Il faut que ce soit le même symbole.");
        return false;
      }
      
      return true;
    }
    
    else if (isZone3) {
      if (!coverCard) return true;

      if (selectedNum !== coverNum - 1) {
        if (verbose) console.log("Il faut que ce soit -1.");
        return false;
      }
      
      if (selectedCard.couleur === coverCard.couleur) {
        if (verbose) console.log("Il faut alterner les couleurs (Rouge/Noir).");
        return false;
      }

      return true;
    }
    
    else if (adverseCards.includes(zoneIdCible)) {
      if (!coverCard) {
        if (verbose) console.log("Il faut une carte pour poser dessus.");
        return false;
      }
      if (selectedNum !== coverNum + 1 && selectedNum !== coverNum - 1) {
        if (verbose) console.log("Il faut que ce soit +1 ou -1.");
        return false;
      }
      if (selectedCard.symbole !== coverCard.symbole) {
        if (verbose) console.log("Pas le même symbole.");
        return false;
      }

      return true;
    }
    
    return false;
  }

  public isTransferable(zoneIdCible: string): boolean {
    const [selectedCard, originalSlot] = this.selectedCard;

    if (!selectedCard || !originalSlot) {
      console.log("Aucune carte n'est sélectionnée.");
      return false;
    }

    const activePlayerCards = (this.activePlayer === 2) ? ['21', '23'] : ['11', '13'];
    const adverseCards = (this.activePlayer === 1) ? ['21', '23'] : ['11', '13'];

    const isZone3 = Board.ZONES_DICT['3'].includes(zoneIdCible);
    const isTargetActivePile = activePlayerCards.includes(zoneIdCible);

    // si on a pris la carte chez l'adversaire, on n'a pas le droit de la mettre 
    // dans la zone 3 ni dans nos propres piles. Elle doit forcément "monter" (zones 4/5).
    if (adverseCards.includes(originalSlot) && (isZone3 || isTargetActivePile)) {
      console.log("Action refusée : Une carte prise à l'adversaire doit obligatoirement monter (zones 4 ou 5).");
      return false;
    }

    return true;
  }

  public isPlayableTransferable(zoneIdCible: string): boolean {
    // on vérifie les règles mathématiques et de couleurs de base
    if (!this.isPlayable(zoneIdCible)) {
      console.log("Mouvement non jouable.");
      return false;
    }
    
    // o n vérifie la règle spéciale du vol de carte adverse
    if (!this.isTransferable(zoneIdCible)) {
      console.log("Mouvement non transférable.");
      return false;
    }
    
    return true;
  }

  public selectCard(zoneId: string) {
    this.lastBoard = {};
    this.slots.forEach((pack, key) => {
      this.lastBoard[key] = new Pack(pack.zoneId, [...pack.cartes]);
    });

    const pack = this.slots.get(zoneId);
    if (pack && !pack.isEmpty()) {
      this.selectedCard = [pack.takeCard()!, zoneId];
    } else {
      console.log("Erreur : La zone sélectionnée est vide.");
    }
  }

  public cardTransfer(zoneIdCible: string) {
    const [card, originalSlot] = this.selectedCard;
    
    if (!card || !originalSlot) {
      console.log("Erreur : Aucune carte sélectionnée pour le transfert.");
      return;
    }

    const targetPack = this.slots.get(zoneIdCible);
    if (!targetPack) return;

    targetPack.addCard(card, false);

    this.lastMoveCard = card;
    this.lastMoveSlot = zoneIdCible;

    const isZone4 = Board.ZONES_DICT['4'].includes(zoneIdCible);
    const isZone5 = Board.ZONES_DICT['5'].includes(zoneIdCible);

    if (isZone4 || isZone5) {
      this.updateCrapetteList(zoneIdCible);
    } else {
      if (this.countCrapette >= 1) { 
        this.countCrapette--; 
      }
    }

    if (this.countSlot12or22 === 1) { 
      this.countSlot12or22 -= 1; 
    }

    const zoneOrigine = this.selectedCard[1]; // si tu stockes bien l'origine de la carte
    
    if (zoneOrigine === '13' || zoneOrigine === '23') {
      const crapettePile = this.slots.get(zoneOrigine);
      if (crapettePile && !crapettePile.isEmpty()) {
          crapettePile.getCard()!.isFaceDown = false;
      }
    }

    this.selectedCard = [null, null];
  }

  public cancelSelection() {
    const [card, originalSlot] = this.selectedCard;

    if (card && originalSlot) {
      const originalPack = this.slots.get(originalSlot);
      if (originalPack) {
        originalPack.addCard(card, card.isFaceDown);
        this.selectedCard = [null, null];
        console.log("Sélection annulée.");
      }
    } else {
      console.log("Aucune carte à annuler.");
    }
  }

  private forceCardTransfert(sourceId: string, targetId: string) {
    const sourcePack = this.slots.get(sourceId);
    const targetPack = this.slots.get(targetId);
    
    if (sourcePack && targetPack && !sourcePack.isEmpty()) {
      const card = sourcePack.takeCard()!;
      targetPack.addCard(card, false); // on la retourne face visible par défaut
    }
  }

  public endRound() {
    this.countSlot12or22 = 0;
    this.activePlayer = (this.activePlayer === 1) ? 2 : 1;
    this.selectedCard = [null, null]; 
  }

  public addDrawPile() {
    if (this.countSlot12or22 === 0) {
      if (this.activePlayer === 1) {
        this.forceCardTransfert('12', '11');
      } else {
        this.forceCardTransfert('22', '21');
      }
      this.countSlot12or22 += 1;
    } else {
      console.log("Tu n'as plus le droit de tirer une carte.");
    }
  }

  public updateCrapetteList(zoneId: string) {
    const pack = this.slots.get(zoneId);
    if (!pack) return;

    const topCard = pack.getCard();
    
    if (!topCard) {
      this.crapetteSources[zoneId] = null;
      return;
    }

    const currentNum = parseInt(topCard.val);

    if (currentNum >= 13) {
      this.crapetteSources[zoneId] = null;
      return;
    }

    const nextNumStr = (currentNum + 1).toString();

    const nextExpectedCard = new Card(
      `expected-${zoneId}-${nextNumStr}`, 
      nextNumStr, 
      topCard.symbole, 
      topCard.dosCouleur
    );

    this.crapetteSources[zoneId] = nextExpectedCard;
  }

  public findCrapetteMoves(): { cardsToMove: Card[], targetSlots: string[] } {
    const cardsToMove: Card[] = [];
    const targetSlots: string[] = [];

    const crapetteSlots = Object.keys(this.crapetteSources);
    const boardSlots = Object.keys(this.lastBoard);

    for (const lastBoardSlot of boardSlots) {
      const pack = this.lastBoard[lastBoardSlot];
      
      if (pack.isEmpty()) continue;

      const candidateCard = pack.getCard();
      if (!candidateCard) continue;

      const candidateNum = parseInt(candidateCard.val);

      // on compare cette carte avec chaque slot attendu (zones 4 et 5)
      for (const crapetteSlot of crapetteSlots) {
        const expectedCard = this.crapetteSources[crapetteSlot];

        // si la case cible est vide, on attend un As
        if (expectedCard === null) {
          if (candidateNum === 1) { 
            cardsToMove.push(candidateCard);
            targetSlots.push(crapetteSlot);
          }
          continue; // on a testé cette case, on passe à la suivante
        }  

        // si elle n'est pas vide, on vérifie la valeur et le symbole
        const expectedNum = parseInt(expectedCard.val);
        if (candidateNum === expectedNum && candidateCard.symbole === expectedCard.symbole) {
          cardsToMove.push(candidateCard);
          targetSlots.push(crapetteSlot);
        }
      }
    }

    return { cardsToMove, targetSlots };
  }

  public isCrapette(): boolean {
    if (this.countCrapette >= 1) return false;

    const { cardsToMove, targetSlots } = this.findCrapetteMoves();

    if (cardsToMove.length === 0) return false;

    const playerCards = (this.activePlayer === 1) ? ['11', '13'] : ['21', '23'];
    
    if (this.lastMoveSlot && playerCards.includes(this.lastMoveSlot)) { 
      return false; 
    }

    if (this.lastMoveSlot) {
      const isZone4 = Board.ZONES_DICT['4'].includes(this.lastMoveSlot);
      const isZone5 = Board.ZONES_DICT['5'].includes(this.lastMoveSlot);
      
      if (isZone4 || isZone5) { 
        return false; 
      }
    }

    this.countCrapette++; 
    console.log("CRAPETTE DÉTECTÉE !", cardsToMove, targetSlots);
    return true;
  }
}