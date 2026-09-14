export class Player {
    public id: number;       // 1 (Créateur) ou 2 (Adversaire)
    public userId: string;   // identifiant persistant (navigateur)
    public socketId: string; // id réseau de la connexion actuelle

    constructor(id: number, userId: string, socketId: string) {
        this.id = id;
        this.userId = userId;
        this.socketId = socketId;
    }
}