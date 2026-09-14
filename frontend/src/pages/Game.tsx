import { useParams, useNavigate } from 'react-router-dom';
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
    cartes, 
    handleCardClick, onDragStart, onDrag, onDragEnd,
    myId, currentTurn, handlePassTurn, message, selectableZones, p1Id 
  } = useGame(roomId || 'table_default');

  const isMyTurn = myId !== '' && myId === currentTurn;
  const isPlayer1 = myId !== '' && myId === p1Id;

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

  const handleLeaveTable = () => {
    if (roomId) gameService.leaveRoom(roomId);
    navigate('/'); 
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-neutral-900 overflow-hidden select-none">
      
      {isWaiting && roomId && <WaitingPopup roomId={roomId} />}

      <button 
        onClick={handleLeaveTable}
        className="absolute top-20 left-12 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-amber-400 transition-colors group z-50 cursor-pointer"
      >
        <span className="text-xl transition-transform group-hover:-translate-x-2">←</span>
        Menu Principal
      </button>

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

      {!isWaiting && isMyTurn && (
        <button 
          onClick={handlePassTurn}
          className="absolute bottom-16 left-8 z-50 group flex items-center gap-4 bg-gradient-to-b from-neutral-800 to-neutral-950 hover:from-neutral-700 hover:to-neutral-900 text-white font-black uppercase tracking-widest px-8 py-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.6)] border-2 border-neutral-700 active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-amber-500 group-hover:text-amber-400 transition-colors">Passer mon tour</span>
          <span className="text-xl group-hover:translate-x-1.5 transition-transform">⏭️</span>
        </button>
      )}

      {message && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-red-600/90 text-white rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.5)] border-2 border-red-400 backdrop-blur-md animate-bounce pointer-events-none text-center min-w-[300px]">
          <p className="font-black tracking-widest uppercase text-lg text-white drop-shadow-md">
            {message}
          </p>
        </div>
      )}

      <Board 
        cartes={cartes}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onCardClick={handleCardClick} 
        selectableZones={selectableZones}
        isPlayer1={isPlayer1}
      />
    </div>
  );
}