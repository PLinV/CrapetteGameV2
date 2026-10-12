import { Board } from './Board';
import { PlayerNumber } from '../../constant/plateau';

export class GameRoom {
  // Jeton secret de chaque joueur (jamais envoyé à l'adversaire) :
  // index 0 = joueur 1 (cartes rouges), index 1 = joueur 2 (cartes bleues).
  public players: [string | null, string | null] = [null, null];
  // La partie n'existe que lorsque les deux joueurs sont à table.
  public board: Board | null = null;
  // Joueurs qui veulent rejouer après la fin de la partie.
  private rematchVotes = new Set<string>();

  // Renvoie le numéro du joueur, ou null si la table est pleine.
  // Un joueur déjà assis (rechargement de page) retrouve sa place.
  public join(token: string): PlayerNumber | null {
    const existing = this.playerNumber(token);
    if (existing) return existing;

    const seat = this.players.indexOf(null);
    if (seat === -1) return null;

    this.players[seat] = token;
    if (this.players.every(Boolean)) this.newGame();
    return (seat + 1) as PlayerNumber;
  }

  // Quand un joueur quitte la table, la partie en cours est abandonnée.
  public leave(token: string) {
    this.players = this.players.map((id) => (id === token ? null : id)) as GameRoom['players'];
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
    };
  }
}
