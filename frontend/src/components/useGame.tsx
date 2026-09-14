import { useState, useEffect, useRef } from 'react';
import { ZONES_PLATEAU } from '../../../constant/plateau';
import { gameService } from '../services/gameService';

export type CarteData = {
  id: string; val: string; symbole: string; couleur: 'rouge' | 'noir'; zoneId: string;
  isFaceDown?: boolean; dosCouleur?: 'rouge' | 'bleu'; zOrder: number;
};

export const useGame = (roomId: string) => {
  const [cartes, setCartes] = useState<CarteData[]>([]);
  const [selectableZones, setSelectableZones] = useState<string[]>([]);
  
  const [myId, setMyId] = useState<string>('');
  const [p1Id, setP1Id] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);

  const lastEmitRef = useRef<number>(0);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    const handleRoleAssigned = (id: string) => setMyId(id);
    const handleGameStart = (gameState: any) => {
      setCurrentTurn(gameState.turn);
      setCartes(gameState.cartes || []); 
      setSelectableZones(gameState.selectableZones || []); 
      setP1Id(gameState.player1 || '');
    };
    const handleTurnUpdated = (turnId: string) => setCurrentTurn(turnId);
    
    // ... (Logique DOM pur pour l'adversaire supprimée ici pour la clarté) ...
    
    const handleGrabError = (msg: string) => showMessage(`❌ ${msg}`);
    const handleActionError = (msg: string) => showMessage(`⚠️ ${msg}`);
    const handleCrapette = () => showMessage(`🚨 CRAPETTE DÉTECTÉE ! 🚨`);

    gameService.onRoleAssigned(handleRoleAssigned);
    gameService.onGameStart(handleGameStart);
    gameService.onTurnUpdated(handleTurnUpdated);
    gameService.onCardGrabbedError(handleGrabError);
    gameService.onActionError(handleActionError);
    gameService.onCrapetteDetected(handleCrapette);

    return () => {
      gameService.offRoleAssigned(handleRoleAssigned);
      gameService.offGameStart(handleGameStart);
      gameService.offTurnUpdated(handleTurnUpdated);
      gameService.offCardGrabbedError(handleGrabError);
      gameService.offActionError(handleActionError);
      gameService.offCrapetteDetected(handleCrapette);
    };
  }, []);

  // 🚨 DÉCLARATION FORMELLE DE LA FONCTION
  const handlePassTurn = () => gameService.passTurn(roomId);

  const handleCardClick = (carteId: string) => {
    if (myId !== currentTurn) return;
    const card = cartes.find(c => c.id === carteId);
    if (!card) return;

    const isPlayer1 = myId === p1Id;
    const maPioche = isPlayer1 ? '12' : '22';

    if (card.zoneId === maPioche) {
      gameService.drawCard(roomId);
    } else if (card.zoneId === '12' || card.zoneId === '22') {
      showMessage("❌ Vous ne pouvez pas toucher la pioche adverse !");
    }
  };
  
  const onDragStart = (carteId: string, zoneId: string) => {
    if (myId !== currentTurn) return; 
    gameService.cardPointerDown(roomId, zoneId);
  };

  const onDrag = (e: any, info: any, carteId: string) => {
    const now = Date.now();
    if (now - lastEmitRef.current > 80) {
      gameService.dragCard(roomId, carteId, { x: info.point.x, y: info.point.y }, { x: 0, y: 0 });
      lastEmitRef.current = now;
    }
  };

  const onDragEnd = (e: any, info: any, carteId: string) => {
    const elementsUnderMouse = document.elementsFromPoint(info.point.x, info.point.y);
    const targetElement = elementsUnderMouse.find(el => {
      const dropZone = el.closest('[data-zone]');
      const isSelf = dropZone && dropZone.getAttribute('data-card-id') === carteId;
      return !isSelf && (el.closest('.zone') || dropZone);
    });
    
    let newZoneId = "00";
    if (targetElement) {
      const zoneDiv = targetElement.closest('.zone') as HTMLElement;
      const cardWrapper = targetElement.closest('[data-zone]') as HTMLElement;
      const foundZoneId = (zoneDiv?.id) || (cardWrapper?.getAttribute('data-zone'));
      if (foundZoneId && ZONES_PLATEAU.includes(foundZoneId)) newZoneId = foundZoneId;
    }
    gameService.cardDropZone(roomId, newZoneId);
  };

  return { 
    cartes, 
    handleCardClick, 
    onDragStart, 
    onDrag, 
    onDragEnd, 
    handlePassTurn, 
    myId, 
    currentTurn, 
    message, 
    selectableZones, 
    p1Id
  };
};