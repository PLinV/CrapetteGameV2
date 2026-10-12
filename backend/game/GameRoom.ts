import { Board } from './Board';
import { PlayerNumber } from '../../constant/plateau';

export class GameRoom {
  // userId des joueurs : index 0 = joueur 1 (haut), index 1 = joueur 2 (bas).
  public players: [string | null, string | null] = [null, null];
  // La partie n'existe que lorsque les deux joueurs sont à table.
  public board: Board | null = null;

  // Renvoie le numéro du joueur, ou null si la table est pleine.
  // Un joueur déjà assis (rechargement de page) retrouve sa place.
  public join(userId: string): PlayerNumber | null {
    const existing = this.playerNumber(userId);
    if (existing) return existing;

    const seat = this.players.indexOf(null);
    if (seat === -1) return null;

    this.players[seat] = userId;
    if (this.players.every(Boolean)) this.board = new Board();
    return (seat + 1) as PlayerNumber;
  }

  // Quand un joueur quitte la table, la partie en cours est abandonnée.
  public leave(userId: string) {
    this.players = this.players.map((id) => (id === userId ? null : id)) as GameRoom['players'];
    this.board = null;
  }

  public isEmpty(): boolean {
    return this.players.every((id) => id === null);
  }

  public playerNumber(userId: string): PlayerNumber | null {
    const index = this.players.indexOf(userId);
    return index === -1 ? null : ((index + 1) as PlayerNumber);
  }

  public state() {
    return {
      players: this.players,
      turn: this.board ? this.players[this.board.activePlayer - 1] : null,
      cartes: this.board?.clientCards() ?? [],
      selectableZones: this.board?.selectableZones() ?? [],
    };
  }
}
