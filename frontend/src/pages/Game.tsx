import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';
import { useGame } from '../components/useGame';
import Board from '../components/Board';
import WaitingPopup from '../components/WaitingPopup';

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(true);

  const { 
    cartes, draggingId, opponentDrag, mousePos, dragOffset, handlePointerDown, handleCardClick,
    myId, currentTurn, handlePassTurn
  } = useGame(roomId || 'table_default');

  const isMyTurn = myId !== '' && myId === currentTurn;

  useEffect(() => {
    if (roomId) gameService.joinRoom(roomId);

    const handleWaiting = () => setIsWaiting(true);
    const handleGameStart = () => setIsWaiting(false);
    const handleRoomError = (msg: string) => {
      alert(msg);
      navigate('/matchmaking'); 
    };

    gameService.onWaitingForOpponent(handleWaiting);
    gameService.onGameStart(handleGameStart);
    gameService.onRoomError(handleRoomError);

    return () => {
      gameService.offWaitingForOpponent(handleWaiting);
      gameService.offGameStart(handleGameStart);
      gameService.offRoomError(handleRoomError);
    };
  }, [roomId, navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-neutral-900 overflow-hidden select-none">
      
      {isWaiting && roomId && <WaitingPopup roomId={roomId} />}

      {/* BOUTON RETOUR (Descendu légèrement: top-10 au lieu de top-6) */}
      <Link 
        to="/" 
        className="absolute top-20 left-12 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-amber-400 transition-colors group z-50"
      >
        <span className="text-xl transition-transform group-hover:-translate-x-2">←</span>
        Menu Principal
      </Link>

      {/* STATUT DU JOUEUR (Déplacé en HAUT À DROITE) */}
      {!isWaiting && (
        <div className="absolute top-8 right-8 z-50 p-4 bg-black/80 rounded-2xl border border-neutral-700 backdrop-blur-md shadow-2xl flex flex-col gap-1 min-w-[220px] items-end">
          <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">Statut de la table</p>
          <div className="text-sm font-black uppercase tracking-widest mt-1">
            {isMyTurn ? (
              <span className="text-green-400 flex items-center gap-3">
                À vous de jouer 
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]"></span>
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-3">
                Tour adverse... 
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* BOUTON PASSER LE TOUR (Remonté et Redesigné style Casino Premium) */}
      {!isWaiting && isMyTurn && (
        <button 
          onClick={handlePassTurn}
          className="absolute bottom-16 left-8 z-50 group flex items-center gap-4 bg-gradient-to-b from-neutral-800 to-neutral-950 hover:from-neutral-700 hover:to-neutral-900 text-white font-black uppercase tracking-widest px-8 py-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.6)] border-2 border-neutral-700 active:scale-95 transition-all"
        >
          <span className="text-amber-500 group-hover:text-amber-400 transition-colors">Passer mon tour</span>
          <span className="text-xl group-hover:translate-x-1.5 transition-transform">⏭️</span>
        </button>
      )}

      <Board 
        cartes={cartes}
        draggingId={draggingId}
        opponentDrag={opponentDrag}
        mousePos={mousePos}
        dragOffset={dragOffset}
        onCardPointerDown={handlePointerDown}
        onCardClick={handleCardClick} 
      />
    </div>
  );
}