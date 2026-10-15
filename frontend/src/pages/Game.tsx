import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useGame } from '../hooks/useGame';
import { useFitScale } from '../hooks/useFitScale';
import { useSideSpace } from '../hooks/useSideSpace';
import Board from '../components/Board';
import WaitingPopup from '../components/WaitingPopup';
import GameOverPopup from '../components/GameOverPopup';
import AdminPanel from '../components/AdminPanel';
import PasswordPrompt from '../components/PasswordPrompt';
import GameMenu from '../components/GameMenu';
import ConnectionLost from '../components/ConnectionLost';
import ChatPanel from '../components/ChatPanel';

// Le chat prend la bande libre à droite du plateau si elle est assez large, sinon il passe par-dessus.
const MIN_SIDE_CHAT_WIDTH = 300;
const CHAT_OPEN_KEY = 'crapette.chatOpen'; // chat ouvert ou fermé, retenu d'une partie à l'autre

const readChatOpen = () => {
  try {
    return localStorage.getItem(CHAT_OPEN_KEY) === '1';
  } catch {
    return false;
  }
};

const MESSAGE_STYLES = {
  error: 'bg-red-600/90 border-red-400 shadow-[0_10px_40px_rgba(220,38,38,0.5)] text-white',
  crapette: 'bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] border-white shadow-[0_10px_40px_rgba(212,175,55,0.6)] text-[#8b0000]',
};

export default function Game() {
  const roomId = useParams<{ roomId: string }>().roomId!;
  const navigate = useNavigate();
  const {
    connectionLost, room, passwordPrompt, submitPassword, state, message, mySeat, isMyTurn, isPlayer1, isAdmin,
    draw, recycle, move, passTurn, callCrapette, playAgain, adminAction, leave, chat, sendChat, warn,
  } = useGame(roomId);
  const isOver = !!state?.winner;

  // Le plateau a une taille fixe : on le met à l'échelle pour qu'il tienne dans la fenêtre.
  const boardRef = useRef<HTMLDivElement>(null);
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const scale = useFitScale(boardRef, boardAreaRef);

  const rootRef = useRef<HTMLDivElement>(null);
  const sideSpace = useSideSpace(boardRef, rootRef);
  const sideChat = sideSpace >= MIN_SIDE_CHAT_WIDTH;
  const [chatOpen, setChatOpen] = useState(readChatOpen);
  // Messages de l'adversaire arrivés pendant que le chat était fermé.
  const [lastSeenId, setLastSeenId] = useState(0);
  const lastId = chat.at(-1)?.id ?? 0;
  const unread = chatOpen ? 0 : chat.filter((m) => m.seat !== mySeat && m.id > lastSeenId).length;
  const toggleChat = (open: boolean) => {
    setChatOpen(open);
    if (!open) setLastSeenId(lastId); // tout ce qui était affiché a été vu
    try {
      localStorage.setItem(CHAT_OPEN_KEY, open ? '1' : '0');
    } catch {
      // stockage indisponible (navigation privée...) : le choix n'est simplement pas retenu
    }
  };

  const handleLeave = () => {
    leave();
    navigate('/');
  };

  return (
    <div ref={rootRef} className="relative flex w-full h-dvh bg-neutral-900 overflow-hidden select-none">
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
            {message.text}
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
              onRecycle={recycle}
              onMove={move}
              canCallCrapette={!!state && !isMyTurn && !isOver}
              onCrapette={callCrapette}
              players={state?.players ?? []}
              activeSeat={isOver ? null : state?.turn ?? null}
              onPassTurn={passTurn}
              onBlockedMove={warn}
              menu={<GameMenu room={room} onLeave={handleLeave} />}
            />
          </div>
        </MotionConfig>
      </div>

      {chatOpen ? (
        <ChatPanel
          messages={chat}
          mySeat={mySeat}
          onSend={sendChat}
          onClose={() => toggleChat(false)}
          overlay={!sideChat}
          width={sideSpace}
        />
      ) : (
        <button
          onClick={() => toggleChat(true)}
          aria-label={unread ? `Ouvrir la discussion (${unread} non lu${unread > 1 ? 's' : ''})` : 'Ouvrir la discussion'}
          // Dans la bande libre à droite du plateau s'il y en a une, sinon dans le coin en bas à droite.
          className={`absolute z-[100] right-4 ${sideSpace >= 88 ? 'top-1/2 -translate-y-1/2' : 'bottom-4'} w-14 h-14 rounded-full bg-neutral-800 border-2 border-amber-500/70 text-2xl shadow-[0_6px_20px_rgba(0,0,0,0.6)] hover:bg-neutral-700 hover:border-amber-300 active:scale-95 transition-all cursor-pointer`}
        >
          💬
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-red-600 text-xs font-black text-white flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
