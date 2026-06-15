// frontend/src/components/useGame.tsx
import { useState, useEffect, PointerEvent } from 'react';
import { ZONES_PLATEAU } from '../../../constant/plateau';

export type CarteData = {
  id: string; val: string; symbole: string; couleur: 'rouge' | 'noir'; zoneId: string;
  isFaceDown?: boolean; dosCouleur?: 'rouge' | 'bleu'; zOrder: number;
};

export const useGame = () => {
  const [cartes, setCartes] = useState<CarteData[]>(() => {
    const initialCards: CarteData[] = [];
    
    // les 13 cartes empilées pour les tests en dur (Zone 31)
    for (let i = 1; i <= 13; i++) {
      initialCards.push({ id: `c${i}`, val: i.toString(), symbole: '♠', couleur: 'noir', zoneId: '31', zOrder: i });
    }

    // test pour la Pioche (12) et la Crapette (13) en dur
    initialCards.push({ id: 'pioche-1', val: '5', symbole: '♣', couleur: 'noir', zoneId: '12', isFaceDown: true, dosCouleur: 'rouge', zOrder: 1 });
    initialCards.push({ id: 'pioche-2', val: 'V', symbole: '♦', couleur: 'rouge', zoneId: '12', isFaceDown: true, dosCouleur: 'rouge', zOrder: 2 });
    
    initialCards.push({ id: 'crap-1', val: 'R', symbole: '♥', couleur: 'rouge', zoneId: '13', isFaceDown: true, dosCouleur: 'bleu', zOrder: 1 });

    return initialCards;
  });

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>, carteId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setMousePos({ x: e.clientX, y: e.clientY });
    setDraggingId(carteId);
    e.preventDefault(); 
  };

  // gère les clics sur les cartes face cachée
  const handleCardClick = (carteId: string) => {
    setCartes(prev => {
      const card = prev.find(c => c.id === carteId);
      if (!card || !card.isFaceDown) return prev;

      const maxZ = Math.max(...prev.map(c => c.zOrder), 0);

      // règle 1 : Dans zone prioritaire (13, 23) -> Se retourne sur place
      if (['13', '23'].includes(card.zoneId)) {
        return prev.map(c => c.id === carteId ? { ...c, isFaceDown: false } : c);
      }
      
      // règle 2 : Dans pioche (12, 22) -> Se retourne ET va dans la défausse (11, 21)
      if (card.zoneId === '12') {
        return prev.map(c => c.id === carteId ? { ...c, isFaceDown: false, zoneId: '11', zOrder: maxZ + 1 } : c);
      }
      if (card.zoneId === '22') {
        return prev.map(c => c.id === carteId ? { ...c, isFaceDown: false, zoneId: '21', zOrder: maxZ + 1 } : c);
      }

      return prev;
    });
  };

  useEffect(() => {
    // (garde le même useEffect qu'à la Turn précédente pour handlePointerMove et handlePointerUp)
    const handlePointerMove = (e: globalThis.PointerEvent) => { if (draggingId) setMousePos({ x: e.clientX, y: e.clientY }); };
    const handlePointerUp = (e: globalThis.PointerEvent) => {
      if (draggingId) {
        const elementsUnderMouse = document.elementsFromPoint(e.clientX, e.clientY);
        const targetElement = elementsUnderMouse.find(el => el.closest('.zone') || el.closest('[data-zone]'));

        if (targetElement) {
          const zoneDiv = targetElement.closest('.zone') as HTMLElement;
          const cardWrapper = targetElement.closest('[data-zone]') as HTMLElement;
          const newZoneId = (zoneDiv?.id) || (cardWrapper?.getAttribute('data-zone'));
          
          if (newZoneId && ZONES_PLATEAU.includes(newZoneId)) {
            setCartes(prev => {
              const maxZ = Math.max(...prev.map(c => c.zOrder));
              return prev.map(c => c.id === draggingId ? { ...c, zoneId: newZoneId, zOrder: maxZ + 1 } : c);
            });
          }
        }
        setDraggingId(null);
      }
    };
    if (draggingId) { window.addEventListener('pointermove', handlePointerMove); window.addEventListener('pointerup', handlePointerUp); }
    return () => { window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', handlePointerUp); };
  }, [draggingId]);

  // exporter handleCardClick
  return { cartes, draggingId, mousePos, dragOffset, handlePointerDown, handleCardClick };
};