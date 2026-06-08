// frontend/src/pages/Game.tsx
import { useGame } from '../components/useGame';
import Board from '../components/Board';

export default function Game() {
  // on récupère handleCardClick ici
  const { cartes, draggingId, mousePos, dragOffset, handlePointerDown, handleCardClick } = useGame();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Board 
        cartes={cartes}
        draggingId={draggingId}
        mousePos={mousePos}
        dragOffset={dragOffset}
        onCardPointerDown={handlePointerDown}
        onCardClick={handleCardClick} 
      />
    </div>
  );
}