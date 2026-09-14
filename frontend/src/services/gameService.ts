// frontend/src/services/gameService.ts
import { socket } from './socket';
import type { CarteData } from '../components/useGame';

export const gameService = {
    getUserId: () => {
    let userId = sessionStorage.getItem('crapette_userId');
    if (!userId) {
      // S'il n'en a pas, on lui crée un ID unique (ex: "player_x7b9q")
      userId = 'player_' + Math.random().toString(36).substring(2, 10);
      sessionStorage.setItem('crapette_userId', userId);
    }
    return userId;
  },

  // 🚨 MODIFIÉ : On envoie l'ID unique au lieu de juste envoyer la room
  joinRoom: (roomId: string) => socket.emit('join_game_room', { roomId, userId: gameService.getUserId() }),
  
  // 🚨 NOUVEAU : Quitter la table proprement
  leaveRoom: (roomId: string) => socket.emit('leave_room', { roomId, userId: gameService.getUserId() }),

  // --- LE RESTE DU CODE RESTE IDENTIQUE ---
  passTurn: (roomId: string) => socket.emit('pass_turn', roomId),
  dragCard: (roomId: string, id: string, mousePos: any, dragOffset: any) => 
    socket.emit('card_dragging', { roomId, id, mousePos, dragOffset }),
  dropCard: (roomId: string) => socket.emit('card_drop', roomId),
  syncCard: (roomId: string, cardId: string, updates: Partial<CarteData>) => 
    socket.emit('sync_card', { roomId, cardId, updates }),

  drawCard: (roomId: string) => socket.emit('draw_card', roomId),
  cardPointerDown: (roomId: string, zoneId: string) => socket.emit('card_pointer_down', { roomId, zoneId }),
  cardDropZone: (roomId: string, zoneIdCible: string) => socket.emit('card_drop_zone', { roomId, zoneIdCible }),

  onWaitingForOpponent: (cb: () => void) => socket.on('waiting_for_opponent', cb),
  onGameStart: (cb: (gameState: any) => void) => socket.on('game_start', cb),
  onRoomError: (cb: (msg: string) => void) => socket.on('room_error', cb),
  onRoleAssigned: (cb: (id: string) => void) => socket.on('role_assigned', cb),
  onTurnUpdated: (cb: (turnId: string) => void) => socket.on('turn_updated', cb),
  onOpponentDragging: (cb: (data: any) => void) => socket.on('opponent_dragging', cb),
  onOpponentDrop: (cb: () => void) => socket.on('opponent_drop', cb),
  onCardSynced: (cb: (data: { cardId: string, updates: Partial<CarteData> }) => void) => socket.on('card_synced', cb),

  offWaitingForOpponent: (cb: () => void) => socket.off('waiting_for_opponent', cb),
  offGameStart: (cb: (gameState: any) => void) => socket.off('game_start', cb),
  offRoomError: (cb: (msg: string) => void) => socket.off('room_error', cb),
  offRoleAssigned: (cb: (id: string) => void) => socket.off('role_assigned', cb),
  offTurnUpdated: (cb: (turnId: string) => void) => socket.off('turn_updated', cb),
  offOpponentDragging: (cb: (data: any) => void) => socket.off('opponent_dragging', cb),
  offOpponentDrop: (cb: () => void) => socket.off('opponent_drop', cb),
  offCardSynced: (cb: (data: any) => void) => socket.off('card_synced', cb),

  onCardGrabbedError: (cb: (msg: string) => void) => socket.on('card_grabbed_error', cb),
  onActionError: (cb: (msg: string) => void) => socket.on('action_error', cb),
  onCrapetteDetected: (cb: () => void) => socket.on('crapette_detected', cb),

  offCardGrabbedError: (cb: (msg: string) => void) => socket.off('card_grabbed_error', cb),
  offActionError: (cb: (msg: string) => void) => socket.off('action_error', cb),
  offCrapetteDetected: (cb: () => void) => socket.off('crapette_detected', cb),
};