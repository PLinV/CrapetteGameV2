export class Player {
    public id: number;       // 1 (Créateur) ou 2 (Adversaire)
    public socketId: string; // L'identifiant réseau de la connexion

    constructor(id: number, socketId: string) {
        this.id = id;
        this.socketId = socketId;
    }
}