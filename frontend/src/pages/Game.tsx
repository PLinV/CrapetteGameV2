import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useFitScale } from '../hooks/useFitScale';
import Board from '../components/Board';
import WaitingPopup from '../components/WaitingPopup';
import GameOverPopup from '../components/GameOverPopup';
import AdminPanel from '../components/AdminPanel';
import PasswordPrompt from '../components/PasswordPrompt';

const MESSAGE_STYLES = {
  error: 'bg-red-600/90 border-red-400 shadow-[0_10px_40px_rgba(220,38,38,0.5)] text-white',
  crapette: 'bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] border-white shadow-[0_10px_40px_rgba(212,175,55,0.6)] text-[#8b0000]',
};

export default function Game() {
  const roomId = useParams<{ roomId: string }>().roomId!;
  const navigate = useNavigate();
  const {
    room, passwordPrompt, submitPassword, state, message, mySeat, isMyTurn, isPlayer1, isAdmin,
    draw, move, passTurn, callCrapette, playAgain, adminAction, leave,
  } = useGame(roomId);
  const isOver = !!state?.winner;

  // Le plateau a une taille fixe : on le met à l'échelle pour qu'il tienne dans la fenêtre.
  const boardRef = useRef<HTMLDivElement>(null);
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(boardRef, boardAreaRef);

  const handleLeave = () => {
    leave();
    navigate('/');
  };

  return (
    <div className="relative flex flex-col w-full h-dvh bg-neutral-900 overflow-hidden select-none">
      {passwordPrompt && (
        <PasswordPrompt {...passwordPrompt} onSubmit={submitPassword} onCancel={() => navigate('/matchmaking')} />
      )}

      {!state && room && <WaitingPopup name={room.name} locked={room.locked} />}

      {state && isAdmin && <AdminPanel onAction={adminAction} />}

      {state?.winner && (
        <GameOverPopup
          won={state.winner === mySeat}
          byForfeit={state.wonByForfeit}
          iAskedRematch={!!mySeat && state.rematchVotes.includes(mySeat)}
          opponentAskedRematch={state.rematchVotes.some((seat) => seat !== mySeat)}
          onPlayAgain={playAgain}
          onLeave={handleLeave}
        />
      )}

      {/* Barre du haut : le plateau est mis à l'échelle en dessous, rien ne le recouvre. */}
      <header className="shrink-0 h-14 px-4 md:px-6 flex items-center gap-4 border-b border-white/5 bg-black/40 z-40">
        <button
          onClick={handleLeave}
          title="La partie est mise en pause : vous pourrez la reprendre depuis l'accueil."
          className="flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest text-gray-400 hover:text-amber-400 transition-colors group cursor-pointer"
        >
          <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
          Menu principal
        </button>

        <span className="flex-1 min-w-0 truncate text-center text-sm font-bold text-gray-300">
          {room && <>{room.locked && '🔒 '}{room.name}</>}
        </span>

        <span className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center gap-2">
          {!state ? null : isOver ? (
            <span className="text-gray-400">Partie terminée</span>
          ) : isMyTurn ? (
            <>
              <span className="text-green-400">À vous de jouer</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]" />
            </>
          ) : (
            <>
              <span className="text-amber-500">Tour adverse</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
            </>
          )}
        </span>
      </header>

      {message && (
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl border-2 backdrop-blur-md animate-bounce pointer-events-none text-center min-w-[300px] ${MESSAGE_STYLES[message.kind]}`}>
          <p className="font-black tracking-widest uppercase text-lg drop-shadow-md">
            {message.kind === 'crapette' ? '🚨' : '⚠️'} {message.text}
          </p>
        </div>
      )}

      {/* Zone du plateau, sous la barre du haut. transformPagePoint corrige le glisser-déposer sous le scale. */}
      <div ref={boardAreaRef} className="flex-1 min-h-0 flex items-center justify-center">
        <MotionConfig transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}>
          <div ref={boardRef} className="shrink-0" style={{ transform: `scale(${scale})` }}>
            <Board
              cartes={state?.cartes ?? []}
              selectableZones={state?.selectableZones ?? []}
              isPlayer1={isPlayer1}
              isMyTurn={isMyTurn && !isOver}
              onDraw={draw}
              onMove={move}
              canCallCrapette={!!state && !isMyTurn && !isOver}
              onCrapette={callCrapette}
              players={state?.players ?? []}
              activeSeat={isOver ? null : state?.turn ?? null}
              onPassTurn={passTurn}
            />
          </div>
        </MotionConfig>
      </div>
    </div>
  );
}
