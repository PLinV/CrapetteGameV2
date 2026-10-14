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
};

// Compte du joueur assis à une place.
export type Account = { id: number; username: string; avatarUrl: string | null };

export class GameRoom {
  // Jeton secret de chaque joueur (jamais envoyé à l'adversaire) :
  // index 0 = joueur 1 (cartes rouges), index 1 = joueur 2 (cartes bleues).
  public players: [string | null, string | null] = [null, null];
  // Compte de chaque joueur (null si la place est libre) : pseudo affiché en partie et historique.
  private accounts: [Account | null, Account | null] = [null, null];
  // Vrai une fois le résultat de la partie en cours enregistré.
  private resultTaken = false;
  // La partie n'existe que lorsque les deux joueurs sont à table.
  public board: Board | null = null;
  // Joueurs qui veulent rejouer après la fin de la partie.
  private rematchVotes = new Set<string>();

  // Renvoie le numéro du joueur, ou null si la table est pleine.
  // Un joueur déjà assis (rechargement de page) retrouve sa place.
  public join(token: string, account: Account): PlayerNumber | null {
    const existing = this.playerNumber(token);
    if (existing) return existing;

    const seat = this.players.indexOf(null);
    if (seat === -1) return null;

    this.players[seat] = token;
    this.accounts[seat] = account;
    if (this.players.every(Boolean)) this.newGame();
    return (seat + 1) as PlayerNumber;
  }

  // Quand un joueur quitte la table, la partie en cours est abandonnée.
  public leave(token: string) {
    const seat = this.players.indexOf(token);
    if (seat === -1) return;
    this.players[seat] = null;
    this.accounts[seat] = null;
    this.board = null;
    this.rematchVotes.clear();
  }

  // Une nouvelle partie démarre quand les deux joueurs ont demandé la revanche.
  public voteRematch(token: string): boolean {
    if (!this.board?.winner || !this.playerNumber(token)) return false;
    this.rematchVotes.add(token);
    if (this.rematchVotes.size === 2) this.newGame();
    return true;
  }

  public newGame() {
    this.board = new Board();
    this.rematchVotes.clear();
    this.resultTaken = false;
  }

  // La partie compte pour l'historique si les deux joueurs sont deux comptes différents
  // (les victoires obtenues avec les outils admin comptent aussi, pour pouvoir tester l'historique).
  private isRanked(): boolean {
    const [id1, id2] = this.accounts.map((account) => account?.id);
    return !!id1 && !!id2 && id1 !== id2;
  }

  // Renvoie le résultat de la partie terminée, une seule fois par partie.
  public takeResult(): GameResult | null {
    const board = this.board;
    if (!board?.winner || this.resultTaken || !this.isRanked()) return null;
    this.resultTaken = true;

    const winner = board.winner;
    const loser: PlayerNumber = winner === 1 ? 2 : 1;
    return {
      winnerId: this.accounts[winner - 1]!.id,
      loserId: this.accounts[loser - 1]!.id,
      winnerCrapettes: board.crapettes[winner],
      loserCrapettes: board.crapettes[loser],
      loserCardsLeft: board.cardsLeft(loser),
      turns: board.turns,
      startedAt: board.startedAt,
    };
  }

  public isEmpty(): boolean {
    return this.players.every((id) => id === null);
  }

  public playerNumber(token: string): PlayerNumber | null {
    const index = this.players.indexOf(token);
    return index === -1 ? null : ((index + 1) as PlayerNumber);
  }

  // État envoyé aux deux joueurs : les joueurs y sont désignés par leur numéro (1 ou 2), pas par leur jeton.
  public state() {
    return {
      turn: this.board?.activePlayer ?? null,
      cartes: this.board?.clientCards() ?? [],
      selectableZones: this.board?.selectableZones() ?? [],
      winner: this.board?.winner ?? null,
      rematchVotes: [...this.rematchVotes].map((token) => this.playerNumber(token)),
      players: this.accounts.map((account) => (account ? { username: account.username, avatarUrl: account.avatarUrl } : null)), // par numéro de joueur
      ranked: this.isRanked(), // la partie sera-t-elle comptée dans l'historique ?
    };
  }
}
