import { Card } from './Card';

export class Pack {
    public zoneId: string;
    public cartes: Card[];

    constructor(zoneId: string, cartes: Card[] = []) {
        this.zoneId = zoneId;
        this.cartes = cartes;
    }

    public shuffle() {
        for (let i = this.cartes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.cartes[i];
            this.cartes[i] = this.cartes[j];
            this.cartes[j] = temp;
        }
        
        // pour que le Frontend sache dans quel ordre les dessiner.
        this.cartes.forEach((card, index) => {
            card.zOrder = index + 1;
        });
    }

    public isEmpty(): boolean {
        return this.cartes.length === 0;
    }

    // regarder la carte du dessus
    public getCard(): Card | undefined {
        return this.cartes[this.cartes.length - 1]; 
    }

    // piocher la carte du dessus
    public takeCard(): Card | undefined {
        return this.cartes.pop(); 
    }

    // ajouter une carte sur le dessus
    public addCard(card: Card, faceDown: boolean = true) {
        card.zoneId = this.zoneId;
        card.isFaceDown = faceDown;
        card.zOrder = this.cartes.length + 1;
        this.cartes.push(card);
    }
}