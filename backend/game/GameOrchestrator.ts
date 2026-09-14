import { Player } from './Player';
import { Board } from './Board';

export const activeGames = new Map<string, GameOrchestrator>();

export class GameOrchestrator {
    public roomId: string;
    public player1: Player | null = null;
    public player2: Player | null = null;
    public currentTurn: string | null = null; // 🚨 Stocke maintenant le userId !
    
    public board: Board; 

    constructor(roomId: string) {
        this.roomId = roomId;
        this.board = new Board('', ''); 
    }

    public addPlayer(userId: string, socketId: string): number {
        // 🔄 Si le joueur existe déjà, on le reconnecte
        if (this.player1 && this.player1.userId === userId) {
            this.reconnectPlayer(userId, socketId);
            return 1;
        }
        if (this.player2 && this.player2.userId === userId) {
            this.reconnectPlayer(userId, socketId);
            return 2;
        }

        // 🆕 Sinon, on ajoute un nouveau joueur
        if (!this.player1) {
            this.player1 = new Player(1, userId, socketId);
            // On met à jour l'entité Player contenue dans le Board
            this.board.p1.userId = userId;
            this.board.p1.socketId = socketId;
            return 1;
        } else if (!this.player2) {
            this.player2 = new Player(2, userId, socketId);
            this.board.p2.userId = userId;
            this.board.p2.socketId = socketId;
            this.startGame();
            return 2;
        }
        return 0; // Table pleine
    }

    // 🚨 NOUVEAU : Fonction de reconnexion
    public reconnectPlayer(userId: string, newSocketId: string) {
        if (this.player1?.userId === userId) {
            this.player1.socketId = newSocketId;
            this.board.p1.socketId = newSocketId; // Maj de la connexion dans le board
        } else if (this.player2?.userId === userId) {
            this.player2.socketId = newSocketId;
            this.board.p2.socketId = newSocketId; // Maj de la connexion dans le board
        }
    }

    private startGame(): void {
        this.board.initGame();
        this.board.whoBegins();
        
        // On synchronise le tour avec l'identifiant persistant
        this.currentTurn = this.board.activePlayer === 1 ? this.player1!.userId : this.player2!.userId;
    }

    // 🚨 MODIFIÉ : On retire le joueur via son userId
    public removePlayer(userId: string) {
        if (this.player1?.userId === userId) this.player1 = null;
        if (this.player2?.userId === userId) this.player2 = null;
    }

    public isEmpty(): boolean {
        return this.player1 === null && this.player2 === null;
    }

    public passTurn(): void {
        this.board.endRound();
        this.currentTurn = this.board.activePlayer === 1 ? this.player1!.userId : this.player2!.userId;
    }

    public getAllCardsArray() {
        let toutesLesCartes: any[] = [];
        
        this.board.slots.forEach((pack, zoneId) => {
            pack.cartes.forEach((card, index) => {
                const carteCensuree = {
                    id: card.id,
                    zoneId: zoneId,
                    isFaceDown: card.isFaceDown,
                    dosCouleur: card.dosCouleur,
                    zOrder: index
                };

                if (card.isFaceDown) {
                    toutesLesCartes.push(carteCensuree);
                } else {
                    toutesLesCartes.push({
                        ...carteCensuree,
                        val: card.val,
                        symbole: card.symbole,
                        couleur: card.couleur
                    });
                }
            });
        });
        
        return toutesLesCartes;
    }

    public getState() {
        // On scanne les zones pour bloquer la souris du joueur adverse sur le frontend
        const selectableZones: string[] = [];
        if (this.board.activePlayer !== 0) {
            this.board.slots.forEach((_, zoneId) => {
                if (this.board.isSelectable(zoneId)) { // true = mode silencieux (sans console.log)
                    selectableZones.push(zoneId);
                }
            });
        }

        return {
            player1: this.player1?.userId, // On envoie les userId
            player2: this.player2?.userId, 
            turn: this.currentTurn,        // C'est maintenant un userId
            cartes: this.getAllCardsArray(),
            selectableZones: selectableZones // N'oublions pas les zones jouables !
        };
    }
}