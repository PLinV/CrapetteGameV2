import { useState, useEffect, PointerEvent } from 'react';
import { ZONES_PLATEAU } from '../../../constant/plateau';
import { gameService } from '../services/gameService';

export type CarteData = {
  id: string; val: string; symbole: string; couleur: 'rouge' | 'noir'; zoneId: string;
  isFaceDown?: boolean; dosCouleur?: 'rouge' | 'bleu'; zOrder: number;
};

export const useGame = (roomId: string) => {
  // 1. RETOUR DES CARTES EN DUR
  const [cartes, setCartes] = useState<CarteData[]>(() => {
    const initialCards: CarteData[] = [];
    for (let i = 1; i <= 13; i++) {
      initialCards.push({ id: `c${i}`, val: i.toString(), symbole: '♠', couleur: 'noir', zoneId: '31', zOrder: i });
    }
    initialCards.push({ id: 'pioche-1', val: '5', symbole: '♣', couleur: 'noir', zoneId: '12', isFaceDown: true, dosCouleur: 'rouge', zOrder: 1 });
    initialCards.push({ id: 'pioche-2', val: 'V', symbole: '♦', couleur: 'rouge', zoneId: '12', isFaceDown: true, dosCouleur: 'rouge', zOrder: 2 });
    initialCards.push({ id: 'crap-1', val: 'R', symbole: '♥', couleur: 'rouge', zoneId: '13', isFaceDown: true, dosCouleur: 'bleu', zOrder: 1 });
    return initialCards;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [opponentDrag, setOpponentDrag] = useState<{ id: string, mousePos: {x:number, y:number}, dragOffset: {x:number, y:number} } | null>(null);

  const [myId, setMyId] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<string>('');

  useEffect(() => {
    const handleRoleAssigned = (id: string) => setMyId(id);
    const handleGameStart = (gameState: any) => {
      setCurrentTurn(gameState.turn);
      // ⚠️ ATTENTION : On a enlevé le setCartes(gameState.cartes) ici pour garder tes cartes en dur !
    };
    const handleTurnUpdated = (newTurnId: string) => setCurrentTurn(newTurnId);
    const handleOpponentDragging = (data: any) => setOpponentDrag(data);
    const handleOpponentDrop = () => setOpponentDrag(null);
    const handleCardSynced = (data: { cardId: string, updates: Partial<CarteData> }) => {
      setCartes(prev => prev.map(c => c.id === data.cardId ? { ...c, ...data.updates } : c));
    };

    gameService.onRoleAssigned(handleRoleAssigned);
    gameService.onGameStart(handleGameStart);
    gameService.onTurnUpdated(handleTurnUpdated);
    gameService.onOpponentDragging(handleOpponentDragging);
    gameService.onOpponentDrop(handleOpponentDrop);
    gameService.onCardSynced(handleCardSynced);

    return () => {
      gameService.offRoleAssigned(handleRoleAssigned);
      gameService.offGameStart(handleGameStart);
      gameService.offTurnUpdated(handleTurnUpdated);
      gameService.offOpponentDragging(handleOpponentDragging);
      gameService.offOpponentDrop(handleOpponentDrop);
      gameService.offCardSynced(handleCardSynced);
    };
  }, []);

  const handlePassTurn = () => {
    gameService.passTurn(roomId);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>, carteId: string) => {
    if (myId !== currentTurn) return; 

    const rect = e.currentTarget.getBoundingClientRect();
    const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragOffset(offset);
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggingId(carteId);
    e.preventDefault(); 
  };

const handleCardClick = (carteId: string) => {
    if (myId !== currentTurn) return;

    setCartes(prev => {
      const card = prev.find(c => c.id === carteId);
      if (!card || !card.isFaceDown) return prev;

      const maxZ = Math.max(...prev.map(c => c.zOrder), 0);
      let updates: Partial<CarteData> | null = null;

      if (['13', '23'].includes(card.zoneId)) {
        updates = { isFaceDown: false };
      } else if (card.zoneId === '12') {
        updates = { isFaceDown: false, zoneId: '11', zOrder: maxZ + 1 };
      } else if (card.zoneId === '22') {
        updates = { isFaceDown: false, zoneId: '21', zOrder: maxZ + 1 };
      }

      if (updates) {
        setTimeout(() => {
          gameService.syncCard(roomId, carteId, updates!);
        }, 0);
        return prev.map(c => c.id === carteId ? { ...c, ...updates } : c);
      }
      return prev;
    });
  };

  useEffect(() => {
    const handlePointerMove = (e: globalThis.PointerEvent) => { 
      if (draggingId) {
        const currentPos = { x: e.clientX, y: e.clientY };
        setMousePos(currentPos);
        gameService.dragCard(roomId, draggingId, currentPos, dragOffset);
      }
    };

    const handlePointerUp = (e: globalThis.PointerEvent) => {
      if (draggingId) {
        const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elementsUnderMouse.find(el => el.closest('.zone') || el.closest('[data-zone]'));
        
        let isValidDrop = false; 

        if (targetElement) {
          const zoneDiv = targetElement.closest('.zone') as HTMLElement;
          const cardWrapper = targetElement.closest('[data-zone]') as HTMLElement;
          const newZoneId = (zoneDiv?.id) || (cardWrapper?.getAttribute('data-zone'));
          
          if (newZoneId && ZONES_PLATEAU.includes(newZoneId)) {
            isValidDrop = true; 
            
            setCartes(prev => {
              const maxZ = Math.max(...prev.map(c => c.zOrder));
              const updates = { zoneId: newZoneId, zOrder: maxZ + 1 };
              
              setTimeout(() => {
                gameService.syncCard(roomId, draggingId, updates);
                gameService.dropCard(roomId); 
              }, 0);
              
              return prev.map(c => c.id === draggingId ? { ...c, ...updates } : c);
            });
          }
        }
        
        if (!isValidDrop) {
            setTimeout(() => gameService.dropCard(roomId), 0);
        }

        setDraggingId(null);
      }
    };

    if (draggingId) { 
      window.addEventListener('pointermove', handlePointerMove); 
      window.addEventListener('pointerup', handlePointerUp); 
    }
    return () => { 
      window.removeEventListener('pointermove', handlePointerMove); 
      window.removeEventListener('pointerup', handlePointerUp); 
    };
  }, [draggingId, dragOffset, roomId]);

  return { 
    cartes, draggingId, opponentDrag, mousePos, dragOffset, 
    handlePointerDown, handleCardClick, 
    myId, currentTurn, handlePassTurn 
  };
};