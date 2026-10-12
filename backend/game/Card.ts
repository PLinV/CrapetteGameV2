export type Symbole = 'Spade' | 'Club' | 'Diamond' | 'Heart';
export type DosCouleur = 'rouge' | 'bleu';

export class Card {
  public readonly couleur: 'rouge' | 'noir';
  public isFaceDown = true;

  constructor(
    public readonly id: string,
    public readonly val: number, // 1 (As) -> 13 (Roi)
    public readonly symbole: Symbole,
    public readonly dosCouleur: DosCouleur,
  ) {
    this.couleur = symbole === 'Heart' || symbole === 'Diamond' ? 'rouge' : 'noir';
  }
}
