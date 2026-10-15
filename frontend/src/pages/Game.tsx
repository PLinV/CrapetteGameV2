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
import GameMenu from '../components/GameMenu';
import ConnectionLost from '../components/ConnectionLost';

const MESSAGE_STYLES = {
  error: 'bg-red-600/90 border-red-400 shadow-[0_10px_40px_rgba(220,38,38,0.5)] text-white',
  crapette: 'bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] border-white shadow-[0_10px_40px_rgba(212,175,55,0.6)] text-[#8b0000]',
};

export default function Game() {
  const roomId = useParams<{ roomId: string }>().roomId!;
  const navigate = useNavigate();
  const {
    connectionLost, room, passwordPrompt, submitPassword, state, message, mySeat, isMyTurn, isPlayer1, isAdmin,
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
    <div className="relative flex w-full h-dvh bg-neutral-900 overflow-hidden select-none">
      {connectionLost && <ConnectionLost />}

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

      {message && (
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl border-2 backdrop-blur-md animate-bounce pointer-events-none text-center min-w-[300px] ${MESSAGE_STYLES[message.kind]}`}>
          <p className="font-black tracking-widest uppercase text-lg drop-shadow-md">
            {message.kind === 'crapette' ? '🚨' : '⚠️'} {message.text}
          </p>
        </div>
      )}

      {/* Le plateau occupe tout l'écran. transformPagePoint corrige le glisser-déposer sous le scale. */}
      <div ref={boardAreaRef} className="flex-1 min-w-0 flex items-center justify-center">
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
              menu={<GameMenu room={room} onLeave={handleLeave} />}
            />
          </div>
        </MotionConfig>
      </div>
    </div>
  );
}
