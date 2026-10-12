import { Card } from './Card';

// Une pile de cartes : la dernière du tableau est celle du dessus.
export class Pack {
  public cartes: Card[] = [];

  public isEmpty(): boolean {
    return this.cartes.length === 0;
  }

  public top(): Card | undefined {
    return this.cartes[this.cartes.length - 1];
  }

  public take(): Card | undefined {
    return this.cartes.pop();
  }

  public add(card: Card, faceDown = false) {
    card.isFaceDown = faceDown;
    this.cartes.push(card);
  }
}
