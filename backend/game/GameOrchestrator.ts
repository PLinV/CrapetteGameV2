import { Player } from './Player';

export function whoBegin(): number {
    return 1; // Le Joueur 1 commence toujours (pour l'instant)
}

export class GameOrchestrator {
    public roomId: string;
    public player1: Player | null = null;
    public player2: Player | null = null;
    public currentTurn: string | null = null;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

public addPlayer(socketId: string): number {
        // si le joueur est déjà à la table, on lui redonne simplement son numéro
        if (this.player1 && this.player1.socketId === socketId) return 1;
        if (this.player2 && this.player2.socketId === socketId) return 2;

        if (!this.player1) {
            this.player1 = new Player(1, socketId);
            return 1;
        } else if (!this.player2) {
            this.player2 = new Player(2, socketId);
            this.startGame();
            return 2;
        }
        return 0; // la partie est pleine
    }

    private startGame(): void {
        const startingPlayerId = whoBegin();
        this.currentTurn = startingPlayerId === 1 ? this.player1!.socketId : this.player2!.socketId;
    }

    public passTurn(socketId: string): boolean {
        if (this.currentTurn === socketId) {
            this.currentTurn = (this.currentTurn === this.player1?.socketId) 
                ? this.player2!.socketId 
                : this.player1!.socketId;
            return true; 
        }
        return false; 
    }

    public getState() {
        return {
            player1: this.player1?.socketId,
            player2: this.player2?.socketId,
            turn: this.currentTurn
        };
    }

    public removePlayer(socketId: string) {
        if (this.player1?.socketId === socketId) this.player1 = null;
        if (this.player2?.socketId === socketId) this.player2 = null;
    }

    public isEmpty(): boolean {
        return this.player1 === null && this.player2 === null;
    }
}




// Le grand dictionnaire qui retient les parties en cours
export const activeGames = new Map<string, GameOrchestrator>();