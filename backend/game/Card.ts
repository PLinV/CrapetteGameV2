export class Card {
    public id: string;
    public val: string;
    public symbole: string;
    public couleur: 'rouge' | 'noir'; 
    public zoneId: string;
    public isFaceDown: boolean;
    public dosCouleur: 'rouge' | 'bleu';
    public zOrder: number;

    constructor(id: string, val: string, symbole: string, dosCouleur: 'rouge' | 'bleu') {
        this.id = id;
        this.val = val;
        this.symbole = symbole;
        this.dosCouleur = dosCouleur;
        this.couleur = (symbole === '♥' || symbole === '♦') ? 'rouge' : 'noir';
        this.zoneId = '0'; 
        this.isFaceDown = true;
        this.zOrder = 0;
    }
}