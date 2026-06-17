import { Server, Socket } from 'socket.io';
import { activeGames, GameOrchestrator } from '../game/GameOrchestrator';

// --- GESTION DE LA ROOM ---
export const handleJoinRoom = (io: Server, socket: Socket, roomId: string) => {
    socket.join(roomId);
    console.log(`🤝 Joueur ${socket.id} a rejoint [${roomId}]`);

    // On crée ou récupère l'Orchestrateur pour cette room
    if (!activeGames.has(roomId)) {
        activeGames.set(roomId, new GameOrchestrator(roomId));
    }
    const game = activeGames.get(roomId)!;
    
    // On ajoute le joueur dans la mémoire
    const playerRole = game.addPlayer(socket.id);

    // On gère l'affichage selon s'il est 1er ou 2ème
    if (playerRole === 1) {
        socket.emit('waiting_for_opponent');
        socket.emit('role_assigned', socket.id); 
    } else if (playerRole === 2) {
        socket.emit('role_assigned', socket.id);
        io.to(roomId).emit('game_start', game.getState());
    } else {
        socket.emit('room_error', 'La table est déjà pleine !');
    }
};

export const handlePassTurn = (io: Server, socket: Socket, roomId: string) => {
    const game = activeGames.get(roomId);
    if (game && game.passTurn(socket.id)) {
        io.to(roomId).emit('turn_updated', game.currentTurn);
    }
};

export const handleDisconnect = (io: Server, socket: Socket) => {
    // On cherche dans toutes les tables actives si ce joueur y était
    activeGames.forEach((game, roomId) => {
        if (game.player1?.socketId === socket.id || game.player2?.socketId === socket.id) {
            
            game.removePlayer(socket.id); // On le lève de sa chaise
            console.log(`Joueur ${socket.id} a quitté la table [${roomId}]`);

            if (game.isEmpty()) {
                // S'il n'y a plus personne, on détruit la table !
                activeGames.delete(roomId);
                console.log(`Table [${roomId}] détruite car vide.`);
            } else {
                // S'il reste l'autre joueur, on le remet en salle d'attente
                io.to(roomId).emit('waiting_for_opponent');
            }
        }
    });
};

// --- GESTION DES CARTES (Ton code réarrangé ici) ---

export const handleCardDragging = (socket: Socket, data: { roomId: string, id: string, mousePos: any, dragOffset: any }) => {
    // Relais de la position de la souris
    socket.to(data.roomId).emit('opponent_dragging', data);
};

export const handleCardDrop = (socket: Socket, roomId: string) => {
    // Relais du lâcher de souris
    socket.to(roomId).emit('opponent_drop');
};

export const handleSyncCard = (socket: Socket, data: { roomId: string, cardId: string, updates: any }) => {
    // Plus tard, c'est ici qu'on vérifiera si le mouvement est autorisé !
    // Pour l'instant, on se contente de relayer l'info
    socket.to(data.roomId).emit('card_synced', data);
};