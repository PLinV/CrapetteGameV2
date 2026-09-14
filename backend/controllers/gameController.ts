import { Server, Socket } from 'socket.io';
import { activeGames, GameOrchestrator } from '../game/GameOrchestrator';

// Petite fonction utilitaire pour trouver le userId à partir du socket.id
const getUserIdFromSocket = (roomId: string, socketId: string): string | null => {
    const game = activeGames.get(roomId);
    if (!game) return null;
    if (game.player1?.socketId === socketId) return game.player1.userId;
    if (game.player2?.socketId === socketId) return game.player2.userId;
    return null;
};

export const handleJoinRoom = (io: Server, socket: Socket, data: { roomId: string, userId: string }) => {
    const { roomId, userId } = data;
    socket.join(roomId);

    if (!activeGames.has(roomId)) {
        activeGames.set(roomId, new GameOrchestrator(roomId));
    }

    const game = activeGames.get(roomId)!;

    // 🔄 LOGIQUE DE RECONNEXION
    if (game.player1?.userId === userId || game.player2?.userId === userId) {
        console.log(`[RECONNEXION] Le joueur ${userId} est de retour !`);
        game.reconnectPlayer(userId, socket.id); 
        socket.emit('role_assigned', userId);
        
        // 🚨 LE FIX EST ICI : On vérifie si les deux joueurs sont bien là !
        if (game.player1 && game.player2) {
            io.to(roomId).emit('game_start', game.getState());
        } else {
            socket.emit('waiting_for_opponent'); // <-- Retour en salle d'attente
        }
        return;
    }

    // NOUVEAU JOUEUR
    const playerId = game.addPlayer(userId, socket.id);

    if (playerId === 0) {
        socket.emit('room_error', 'La table est déjà pleine !');
        return;
    }

    socket.emit('role_assigned', userId);

    if (game.player1 && game.player2) {
        io.to(roomId).emit('game_start', game.getState());
    } else {
        socket.emit('waiting_for_opponent');
    }
};

// 🚨 NOUVEAU : Quand un joueur quitte volontairement via "Menu Principal"
export const handleLeaveRoom = (io: Server, socket: Socket, data: { roomId: string, userId: string }) => {
    const game = activeGames.get(data.roomId);
    if (game) {
        console.log(`[DÉPART] Le joueur ${data.userId} a quitté la room ${data.roomId}.`);
        game.removePlayer(data.userId); 
        
        if (game.isEmpty()) {
            activeGames.delete(data.roomId);
            console.log(`[TABLE FERMÉE] Room ${data.roomId} détruite.`);
        } else {
            io.to(data.roomId).emit('waiting_for_opponent');
        }
    }
};

export const handlePassTurn = (io: Server, socket: Socket, roomId: string) => {
    const game = activeGames.get(roomId);
    const userId = getUserIdFromSocket(roomId, socket.id);

    if (game && userId && game.currentTurn === userId) {
        game.passTurn();
        io.to(roomId).emit('turn_updated', game.currentTurn);
        io.to(roomId).emit('game_start', game.getState());
    }
};

// 🚨 MODIFIÉ : Si un joueur perd la connexion, on ne détruit plus la room
export const handleDisconnect = (io: Server, socket: Socket) => {
    console.log(`[DECO TEMPORAIRE] Socket ${socket.id} perdu (F5 ou perte réseau). En attente de reconnexion...`);
    // On garde la room active dans activeGames. Le joueur reviendra via handleJoinRoom.
};

// =======================================================
// FOCUS TEST : IS_SELECTABLE
// =======================================================

export const handleDrawCard = (io: Server, socket: Socket, roomId: string) => {
    const game = activeGames.get(roomId);
    const userId = getUserIdFromSocket(roomId, socket.id);
    if (!game || game.currentTurn !== userId) return;

    game.board.addDrawPile();
    io.to(roomId).emit('game_start', game.getState()); 
};

export const handleCardPointerDown = (socket: Socket, data: { roomId: string, zoneId: string }) => {
    const { roomId, zoneId } = data;
    const game = activeGames.get(roomId);
    const userId = getUserIdFromSocket(roomId, socket.id);
    if (!game || game.currentTurn !== userId) return;

    console.log(`[TEST SELECT] Joueur tente de prendre zone : ${zoneId}`);

    if (game.board.isSelectable(zoneId, false)) { 
        game.board.selectCard(zoneId);
        console.log(`[TEST SELECT] ✅ SUCCÈS pour ${zoneId}`);
        socket.emit('card_grabbed_ok', zoneId);
    } else {
        console.log(`[TEST SELECT] ❌ REFUS pour ${zoneId}`);
        socket.emit('card_grabbed_error', 'Action interdite : Carte non sélectionnable');
    }
};

export const handleCardDrop = (io: Server, socket: Socket, data: { roomId: string, zoneIdCible: string }) => {
    const { roomId, zoneIdCible } = data;
    const game = activeGames.get(roomId);
    const userId = getUserIdFromSocket(roomId, socket.id);
    
    socket.to(roomId).emit('opponent_drop');

    if (!game || game.currentTurn !== userId) return;

    if (zoneIdCible === "00") {
        console.log(`[TEST DROP] Lâché dans le vide -> Annulation`);
        game.board.cancelSelection();
    } else {
        game.board.cardTransfer(zoneIdCible);
        console.log(`[TEST DROP] ✅ Carte posée avec succès sur ${zoneIdCible}`);
    }
    
    io.to(roomId).emit('game_start', game.getState());
};

export const handleCardDragging = (socket: Socket, data: any) => {
    socket.to(data.roomId).emit('opponent_dragging', data);
};