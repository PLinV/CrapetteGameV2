import { useEffect, useState, type CSSProperties } from 'react';

type GameMenuProps = {
  room: { name: string; locked: boolean } | null;
  onLeave: () => void;
  style?: CSSProperties;
};

const buttonClass =
  'px-4 py-2 rounded-full bg-black/40 border-2 border-white/15 text-sm font-black uppercase tracking-widest text-gray-300 hover:text-amber-400 hover:border-amber-400/60 transition-colors cursor-pointer';

// Coin du plateau : nom de la table, retour au menu et plein écran (remplace la barre du haut).
export default function GameMenu({ room, onLeave, style }: GameMenuProps) {
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    // Refusé par certains navigateurs (iPhone) : la page reste simplement en mode normal.
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div style={style} className="w-full flex flex-col items-center gap-3">
      <span className="max-w-full truncate text-xl font-bold text-white/70">
        {room && <>{room.locked && '🔒 '}{room.name}</>}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onLeave}
          title="La partie est mise en pause : vous pourrez la reprendre depuis l'accueil."
          className={buttonClass}
        >
          ← Menu principal
        </button>
        {document.fullscreenEnabled && (
          <button onClick={toggleFullscreen} title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'} className={buttonClass}>
            {fullscreen ? '🗗' : '⛶'}
          </button>
        )}
      </div>
    </div>
  );
}
