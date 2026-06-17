// frontend/src/services/gameService.ts
import { socket } from './socket';
import type { CarteData } from '../components/useGame';

export const gameService = {
  // --- 1. ÉMISSIONS (Dire au serveur) ---
  joinRoom: (roomId: string) => socket.emit('join_game_room', roomId),
  passTurn: (roomId: string) => socket.emit('pass_turn', roomId),
  dragCard: (roomId: string, id: string, mousePos: any, dragOffset: any) => 
    socket.emit('card_dragging', { roomId, id, mousePos, dragOffset }),
  dropCard: (roomId: string) => socket.emit('card_drop', roomId),
  syncCard: (roomId: string, cardId: string, updates: Partial<CarteData>) => 
    socket.emit('sync_card', { roomId, cardId, updates }),

  // --- 2. ÉCOUTES (Écouter le serveur) ---
  onWaitingForOpponent: (cb: () => void) => socket.on('waiting_for_opponent', cb),
  onGameStart: (cb: (gameState: any) => void) => socket.on('game_start', cb),
  onRoomError: (cb: (msg: string) => void) => socket.on('room_error', cb),
  onRoleAssigned: (cb: (id: string) => void) => socket.on('role_assigned', cb),
  onTurnUpdated: (cb: (turnId: string) => void) => socket.on('turn_updated', cb),
  onOpponentDragging: (cb: (data: any) => void) => socket.on('opponent_dragging', cb),
  onOpponentDrop: (cb: () => void) => socket.on('opponent_drop', cb),
  onCardSynced: (cb: (data: { cardId: string, updates: Partial<CarteData> }) => void) => socket.on('card_synced', cb),

  // --- 3. DÉSABONNEMENTS (Nettoyage) ---
  offWaitingForOpponent: (cb: () => void) => socket.off('waiting_for_opponent', cb),
  offGameStart: (cb: (gameState: any) => void) => socket.off('game_start', cb),
  offRoomError: (cb: (msg: string) => void) => socket.off('room_error', cb),
  offRoleAssigned: (cb: (id: string) => void) => socket.off('role_assigned', cb),
  offTurnUpdated: (cb: (turnId: string) => void) => socket.off('turn_updated', cb),
  offOpponentDragging: (cb: (data: any) => void) => socket.off('opponent_dragging', cb),
  offOpponentDrop: (cb: () => void) => socket.off('opponent_drop', cb),
  offCardSynced: (cb: (data: any) => void) => socket.off('card_synced', cb),
};