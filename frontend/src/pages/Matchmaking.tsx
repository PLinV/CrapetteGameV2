import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSocketConnection } from '../hooks/useSocketConnection';
import Avatar from '../components/Avatar';
import PageLayout, { Suits, inputClass, panelClass, primaryButtonClass } from '../components/PageLayout';

type LobbyRoom = {
  roomId: string;
  name: string;
  host: { username: string; avatarUrl: string | null };
  locked: boolean;
};

const sectionTitleClass = 'text-sm font-black uppercase tracking-widest text-amber-500 mb-5';

// Menu « Jouer » : créer une partie (mot de passe facultatif) ou rejoindre une partie en attente.
export default function Matchmaking() {
  const me = useCurrentUser();
  const navigate = useNavigate();
  // Message d'erreur transmis par la page de partie (partie introuvable, pleine...).
  const errorFromGame: unknown = useLocation().state?.error;

  const [name, setName] = useState(`Table de ${me.username}`);
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(typeof errorFromGame === 'string' ? errorFromGame : '');
  const [isCreating, setIsCreating] = useState(false);
  const [lobby, setLobby] = useState<LobbyRoom[] | null>(null); // null = chargement

  useSocketConnection(() => socket.emit('watch_lobby'), '/matchmaking');

  useEffect(() => {
    socket.on('lobby', setLobby);
    return () => {
      socket.off('lobby', setLobby);
    };
  }, []);

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);
    socket.emit(
      'create_room',
      { name: name.trim(), password: withPassword ? password : undefined },
      (res: { roomId?: string; error?: string }) => {
        setIsCreating(false);
        if (res.roomId) navigate(`/game/${res.roomId}`);
        else setError(res.error ?? 'Une erreur est survenue.');
      },
    );
  };

  return (
    <PageLayout>
      <div className="w-full max-w-5xl flex flex-col gap-8 py-16">
        <div className="text-center">
          <Suits className="text-amber-500/30 mb-4" />
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase">
            Jouer
          </h1>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center font-medium">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-8 items-start">
          <form onSubmit={handleCreate} className={`${panelClass} p-6 md:p-8 flex flex-col gap-5`}>
            <h2 className={sectionTitleClass}>Créer une partie</h2>

            <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Nom de la partie
              <input type="text" required maxLength={30} value={name} onChange={(e) => setName(e.target.value)}
                className={`${inputClass} p-3 text-base normal-case tracking-normal`} />
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={withPassword} onChange={(e) => setWithPassword(e.target.checked)}
                className="w-5 h-5 accent-amber-500 cursor-pointer" />
              🔒 Protéger par un mot de passe
            </label>

            {withPassword && (
              <input type="password" required maxLength={50} placeholder="Mot de passe de la partie" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
                className={`${inputClass} p-3 text-base`} />
            )}

            <button type="submit" disabled={isCreating || !name.trim()}
              className={`${primaryButtonClass} mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-default`}>
              {isCreating ? 'Création...' : 'Créer la partie'}
            </button>
          </form>

          <section className={`${panelClass} p-6 md:p-8`}>
            <h2 className={sectionTitleClass}>
              Parties en attente {lobby && lobby.length > 0 && <span className="text-gray-500">({lobby.length})</span>}
            </h2>

            {lobby === null ? (
              <p className="text-gray-500 animate-pulse">Chargement...</p>
            ) : lobby.length === 0 ? (
              <p className="text-gray-400">Aucune partie en attente pour l'instant : créez la vôtre !</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {lobby.map((room) => {
                  const isMine = room.host.username === me.username;
                  return (
                    <li key={room.roomId} className="flex items-center gap-4 p-3 rounded-2xl bg-black/40 border border-white/10">
                      <Avatar url={room.host.avatarUrl} name={room.host.username} size={44} gold={isMine} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{room.locked && '🔒 '}{room.name}</p>
                        <p className="text-xs text-gray-500 truncate">{isMine ? 'Votre partie' : `par ${room.host.username}`}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/game/${room.roomId}`)}
                        className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-b from-[#2a723f] to-[#113a1e] border border-[#d4af37]/70 text-sm font-black uppercase tracking-wider text-[#ffe8a1] hover:brightness-125 active:scale-95 transition-all cursor-pointer"
                      >
                        {isMine ? 'Retourner' : 'Rejoindre'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
