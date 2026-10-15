import crypto from 'crypto';
import { Board } from './Board';
import { PlayerNumber } from '../../constant/plateau';

// Résultat d'une partie terminée, à enregistrer dans l'historique.
export type GameResult = {
  winnerId: number;
  loserId: number;
  winnerCrapettes: number;
  loserCrapettes: number;
  loserCardsLeft: number;
  turns: number;
  startedAt: Date;
  forfeit: boolean;
  draw: boolean; // match nul : winnerId / loserId sont alors simplement les joueurs 1 et 2
};

// Après un refus, celui qui a proposé le nul attend ce délai avant de le reproposer.
export const DRAW_OFFER_COOLDOWN_MS = 30_000;
export type DrawOfferResult = 'offered' | 'accepted' | 'cooldown' | 'invalid';

// Message du chat de la table. `seat` : numéro du joueur qui l'a écrit.
export type ChatMessage = { id: number; seat: PlayerNumber; username: string; text: string; at: number };
const MAX_CHAT_HISTORY = 100;

// Compte du joueur assis à une place.
export type Account = { id: number; username: string; avatarUrl: string | null };

export type RoomOptions = {
  forfeitDelayMs: number;
  name?: string; // nom affiché dans la liste des parties
  ownerId?: number; // créateur : il entre sans mot de passe
  password?: string; // vide ou absent = partie publique
};

// Le mot de passe d'une table ne vit qu'en mémoire, le temps de la partie : on n'en garde qu'une empreinte salée.
const hashRoomPassword = (salt: string, password: string) =>
  crypto.createHash('sha256').update(salt + password).digest();

export class GameRoom {
  // Compte assis à chaque place (null si elle est libre) :
  // index 0 = joueur 1 (cartes rouges), index 1 = joueur 2 (cartes bleues).
  // La place appartient au compte : un joueur la retrouve en revenant, depuis n'importe quel appareil.
  private accounts: [Account | null, Account | null] = [null, null];
  // Nombre de connexions ouvertes par place (plusieurs onglets possibles) : 0 = joueur absent.
  private connections: [number, number] = [0, 0];
  // Heure (ms) à laquelle un joueur absent pendant une partie perd par forfait, s'il n'est pas revenu.
  private forfeitAt: [number | null, number | null] = [null, null];
  // Heure (ms) à laquelle la table est détruite, quand plus personne n'y est connecté.
  // Une partie en cours est alors annulée : match nul, rien n'est enregistré.
  public closesAt: number | null;
  // Vrai une fois le résultat de la partie en cours enregistré.
  private resultTaken = false;
  // La partie n'existe que lorsque les deux joueurs sont à table.
  public board: Board | null = null;
  // Comptes qui veulent rejouer après la fin de la partie.
  private rematchVotes = new Set<number>();
  // Proposition de match nul en attente de réponse : compte qui l'a faite, ou null.
  private drawOfferBy: number | null = null;
  // Heure (ms) du dernier refus essuyé par chaque compte (délai avant de reproposer).
  private drawRefusedAt = new Map<number, number>();
  // Chat de la table : gardé en mémoire tant que les deux mêmes joueurs y sont assis.
  private chat: ChatMessage[] = [];
  private nextChatId = 1;

  public readonly name: string;
  private readonly ownerId: number | null;
  private readonly forfeitDelayMs: number;
  private readonly passwordSalt = crypto.randomBytes(16).toString('hex');
  private readonly passwordHash: Buffer | null;
  public readonly createdAt = Date.now();

  constructor({ forfeitDelayMs, name = '', ownerId, password }: RoomOptions, now = Date.now()) {
    this.forfeitDelayMs = forfeitDelayMs;
    this.name = name;
    this.ownerId = ownerId ?? null;
    this.passwordHash = password ? hashRoomPassword(this.passwordSalt, password) : null;
    // Une table créée mais jamais rejointe est détruite comme une table vide.
    this.closesAt = now + forfeitDelayMs;
  }

  public get isLocked(): boolean {
    return this.passwordHash !== null;
  }

  // Le créateur et les joueurs déjà assis entrent librement ; les autres doivent donner le mot de passe.
  public canEnter(userId: number, password: unknown): boolean {
    if (!this.passwordHash || userId === this.ownerId || this.seatIndex(userId) !== -1) return true;
    if (typeof password !== 'string') return false;
    return crypto.timingSafeEqual(hashRoomPassword(this.passwordSalt, password), this.passwordHash);
  }

  // Table affichée dans la liste des parties : un seul joueur, connecté, qui attend un adversaire.
  public lobbyEntry() {
    const seated = this.accounts.findIndex(Boolean);
    const host = seated === -1 ? null : this.accounts[seated];
    if (this.board || !host || this.accounts.filter(Boolean).length !== 1 || this.connections[seated] === 0) return null;
    return { name: this.name, host: { username: host.username, avatarUrl: host.avatarUrl }, locked: this.isLocked };
  }

  public isOwnedBy(userId: number): boolean {
    return this.ownerId === userId;
  }

  // Renvoie le numéro du joueur, ou null si la table est pleine.
  // Un joueur déjà assis (rechargement, coupure, retour du menu, autre appareil) reprend la partie en cours.
  public join(account: Account, now = Date.now()): PlayerNumber | null {
    let seat = this.seatIndex(account.id);
    if (seat === -1) {
      seat = this.accounts.indexOf(null);
      if (seat === -1) return null;
    }
    this.accounts[seat] = account; // pseudo et photo à jour
    this.connections[seat]++;
    this.closesAt = null;
    if (!this.board && this.accounts.every(Boolean)) this.newGame(now);
    this.updateForfeits(now);
    return (seat + 1) as PlayerNumber;
  }

  // Le joueur quitte la table (bouton « Menu principal », onglet fermé, coupure réseau...).
  // Pendant une partie, il garde sa place : il a forfeitDelayMs pour revenir.
  // Sans partie en cours (attente d'un adversaire, partie finie), sa place est libérée.
  public leave(userId: number, now = Date.now()) {
    const seat = this.seatIndex(userId);
    if (seat === -1) return;
    this.connections[seat] = Math.max(0, this.connections[seat] - 1);
    if (this.connections[seat] === 0 && !this.isPlaying()) {
      this.accounts[seat] = null;
      this.board = null;
      this.rematchVotes.clear();
      this.chat = []; // un nouvel adversaire ne voit pas la conversation précédente
    }
    this.updateForfeits(now);
    if (!this.hasConnections()) this.closesAt = now + this.forfeitDelayMs;
  }

  public hasConnections(): boolean {
    return this.connections.some((count) => count > 0);
  }

  private isPlaying(): boolean {
    return !!this.board && !this.board.isOver;
  }

  // Démarre le compte à rebours d'un joueur absent pendant une partie, si son adversaire est là.
  // Si les deux sont partis, plus personne ne peut gagner : la table sera détruite (voir closesAt),
  // et celui qui revient avant repart avec un compteur neuf pour l'autre.
  private updateForfeits(now: number) {
    this.forfeitAt = this.connections.map((count, seat) => {
      if (count > 0 || !this.isPlaying() || !this.hasConnections()) return null;
      return this.forfeitAt[seat] ?? now + this.forfeitDelayMs;
    }) as GameRoom['forfeitAt'];
  }

  // Prochaine échéance de forfait (pour programmer une vérification), ou null.
  public nextForfeitAt(): number | null {
    const deadlines = this.forfeitAt.filter((at): at is number => at !== null);
    return deadlines.length ? Math.min(...deadlines) : null;
  }

  // Un joueur absent depuis trop longtemps perd (son adversaire est forcément là, voir updateForfeits).
  public applyForfeits(now = Date.now()): boolean {
    const board = this.board;
    if (!board || board.isOver) return false;
    const seat = this.forfeitAt.findIndex((at, i) => at !== null && at <= now && this.connections[1 - i] > 0);
    if (seat === -1) return false;
    board.forfeit((seat + 1) as PlayerNumber);
    this.forfeitAt = [null, null];
    return true;
  }

  // Une nouvelle partie démarre quand les deux joueurs ont demandé la revanche.
  public voteRematch(userId: number): boolean {
    if (!this.board?.isOver || !this.playerNumber(userId)) return false;
    this.rematchVotes.add(userId);
    if (this.rematchVotes.size === 2) this.newGame();
    return true;
  }

  public newGame(now = Date.now()) {
    this.board = new Board();
    this.rematchVotes.clear();
    this.drawOfferBy = null;
    this.drawRefusedAt.clear();
    this.resultTaken = false;
    this.forfeitAt = [null, null];
    this.updateForfeits(now);
  }

  // Renvoie le résultat de la partie terminée, une seule fois par partie.
  // Les victoires obtenues avec les outils admin comptent aussi, pour pouvoir tester l'historique.
  public takeResult(): GameResult | null {
    const board = this.board;
    const [account1, account2] = this.accounts;
    if (!board?.isOver || this.resultTaken || !account1 || !account2) return null;
    this.resultTaken = true;

    const winner = board.winner ?? 1; // match nul : le joueur 1 est rangé en « gagnant », sans effet sur les stats
    const loser: PlayerNumber = winner === 1 ? 2 : 1;
    return {
      winnerId: this.accounts[winner - 1]!.id,
      loserId: this.accounts[loser - 1]!.id,
      winnerCrapettes: board.crapettes[winner],
      loserCrapettes: board.crapettes[loser],
      loserCardsLeft: board.cardsLeft(loser),
      turns: board.turns,
      startedAt: board.startedAt,
      forfeit: board.wonByForfeit,
      draw: board.isDraw,
    };
  }

  // Temps (ms) avant que ce compte puisse de nouveau proposer le nul.
  public drawCooldownMs(userId: number, now = Date.now()): number {
    const refusedAt = this.drawRefusedAt.get(userId);
    return refusedAt === undefined ? 0 : Math.max(0, refusedAt + DRAW_OFFER_COOLDOWN_MS - now);
  }

  // Un joueur propose le match nul. Si son adversaire l'avait déjà proposé, c'est un accord : la partie est nulle.
  public offerDraw(userId: number, now = Date.now()): DrawOfferResult {
    if (!this.isPlaying() || !this.playerNumber(userId) || this.drawOfferBy === userId) return 'invalid';
    if (this.drawOfferBy !== null) return this.answerDraw(userId, true) ? 'accepted' : 'invalid';
    if (this.drawCooldownMs(userId, now) > 0) return 'cooldown';
    this.drawOfferBy = userId;
    return 'offered';
  }

  // L'adversaire de celui qui a proposé accepte (partie nulle) ou refuse (délai avant une nouvelle proposition).
  public answerDraw(userId: number, accept: boolean, now = Date.now()): boolean {
    const by = this.drawOfferBy;
    if (by === null || by === userId || !this.playerNumber(userId) || !this.isPlaying()) return false;
    this.drawOfferBy = null;
    if (accept) this.board!.endInDraw();
    else this.drawRefusedAt.set(by, now);
    return true;
  }

  // Celui qui a proposé le nul retire sa proposition.
  public cancelDrawOffer(userId: number): boolean {
    if (this.drawOfferBy !== userId) return false;
    this.drawOfferBy = null;
    return true;
  }

  // Ajoute un message écrit par un joueur assis à la table (texte déjà vérifié), ou renvoie null.
  public addChatMessage(userId: number, text: string, now = Date.now()): ChatMessage | null {
    const seat = this.playerNumber(userId);
    if (!seat) return null;
    const message = { id: this.nextChatId++, seat, username: this.accounts[seat - 1]!.username, text, at: now };
    this.chat.push(message);
    if (this.chat.length > MAX_CHAT_HISTORY) this.chat.shift();
    return message;
  }

  public chatHistory(): ChatMessage[] {
    return this.chat;
  }

  public seatedUserIds(): number[] {
    return this.accounts.filter((account): account is Account => account !== null).map((account) => account.id);
  }

  public isEmpty(): boolean {
    return this.accounts.every((account) => account === null);
  }

  private seatIndex(userId: number): number {
    return this.accounts.findIndex((account) => account?.id === userId);
  }

  public playerNumber(userId: number): PlayerNumber | null {
    const index = this.seatIndex(userId);
    return index === -1 ? null : ((index + 1) as PlayerNumber);
  }

  // Partie en cours que ce joueur a quittée, pour lui proposer de la reprendre depuis l'accueil.
  // endsIn : temps qu'il lui reste avant de perdre par forfait ('forfeit'),
  // ou avant l'annulation de la partie si son adversaire est parti aussi ('cancel').
  public pausedGameOf(userId: number, now = Date.now()): { endsInMs: number; ending: 'forfeit' | 'cancel' } | null {
    const seat = this.seatIndex(userId);
    if (seat === -1 || this.connections[seat] > 0 || !this.isPlaying()) return null;
    const forfeitAt = this.forfeitAt[seat];
    if (forfeitAt !== null) return { endsInMs: Math.max(0, forfeitAt - now), ending: 'forfeit' };
    if (this.closesAt !== null) return { endsInMs: Math.max(0, this.closesAt - now), ending: 'cancel' };
    return null;
  }

  // État envoyé aux deux joueurs : les joueurs y sont désignés par leur numéro (1 ou 2), jamais par leur id.
  public state(now = Date.now()) {
    return {
      turn: this.board?.activePlayer ?? null,
      cartes: this.board?.clientCards() ?? [],
      selectableZones: this.board?.selectableZones() ?? [],
      winner: this.board?.winner ?? null,
      wonByForfeit: this.board?.wonByForfeit ?? false,
      draw: this.board?.isDraw ?? false,
      // numéro du joueur qui propose le match nul, en attente de réponse
      drawOfferBy: this.isPlaying() && this.drawOfferBy !== null ? this.playerNumber(this.drawOfferBy) : null,
      rematchVotes: [...this.rematchVotes].map((userId) => this.playerNumber(userId)),
      // par numéro de joueur ; forfeitInMs : temps qu'il reste à un joueur absent pour revenir
      players: this.accounts.map((account, i) => {
        if (!account) return null;
        const at = this.forfeitAt[i];
        return {
          username: account.username,
          avatarUrl: account.avatarUrl,
          connected: this.connections[i] > 0,
          forfeitInMs: at === null ? null : Math.max(0, at - now),
          // temps avant de pouvoir crier de nouveau « Crapette ! »
          crapetteCooldownMs: this.board?.crapetteCooldownMs((i + 1) as PlayerNumber, now) ?? 0,
          // temps avant de pouvoir reproposer le nul après un refus
          drawCooldownMs: this.drawCooldownMs(account.id, now),
        };
      }),
    };
  }
}
