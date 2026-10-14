import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';
import { useCurrentUser } from '../hooks/useCurrentUser';
import PageLayout, { Suits, panelClass, primaryButtonClass } from '../components/PageLayout';

type PlayerRow = {
  rank: number;
  username: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  crapettes: number;
};
type Rivalry = { player1: string; player2: string; wins1: number; wins2: number };

const MEDALS = ['🥇', '🥈', '🥉'];
// Ordre d'affichage du podium : 2e, 1er, 3e.
const PODIUM = [
  { index: 1, height: 'h-28', color: 'from-gray-300 to-gray-500' },
  { index: 0, height: 'h-36', color: 'from-[#ffe8a1] to-[#d4af37]' },
  { index: 2, height: 'h-20', color: 'from-orange-300 to-orange-700' },
];

const sectionTitleClass = 'text-sm font-black uppercase tracking-widest text-amber-500 mb-4';

// Classement général de tous les joueurs, avec podium et duels les plus joués.
export default function Leaderboard() {
  const me = useCurrentUser();
  const [data, setData] = useState<{ players: PlayerRow[]; rivalries: Rivalry[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth('/leaderboard')
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setData(await res.json());
      })
      .catch(() => setError('Impossible de charger le classement.'));
  }, []);

  if (!data) {
    return (
      <PageLayout>
        <div className={error ? 'text-red-400' : 'text-amber-500 animate-pulse font-bold tracking-widest uppercase'}>
          {error || 'Chargement...'}
        </div>
      </PageLayout>
    );
  }

  const { players, rivalries } = data;

  return (
    <PageLayout>
      <div className="w-full max-w-4xl flex flex-col gap-8 py-16">
        <div className="text-center">
          <Suits className="text-amber-500/30 mb-4" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase">
            Classement
          </h1>
        </div>

        {players.length === 0 ? (
          <div className={`${panelClass} p-10 text-center flex flex-col items-center gap-6`}>
            <p className="text-gray-400">Aucune partie terminée pour l'instant : le classement est vide.</p>
            <Link to="/matchmaking" className={`${primaryButtonClass} max-w-xs`}>Jouer</Link>
          </div>
        ) : (
          <>
            <section className={`${panelClass} p-6 md:p-8`}>
              <div className="flex items-end justify-center gap-3 md:gap-6">
                {PODIUM.map(({ index, height, color }) => {
                  const player = players[index];
                  if (!player) return <div key={index} className="w-24 md:w-36" />;
                  return (
                    <div key={index} className="w-24 md:w-36 flex flex-col items-center gap-2">
                      <span className="text-3xl md:text-4xl">{MEDALS[index]}</span>
                      <span className={`max-w-full truncate font-black ${player.username === me.username ? 'text-amber-300' : 'text-white'}`}>
                        {player.username}
                      </span>
                      <span className="text-xs text-gray-400">{player.wins} V · {player.winRate} %</span>
                      <div className={`w-full ${height} rounded-t-xl bg-gradient-to-b ${color} flex items-start justify-center pt-2 text-3xl font-black text-black/60`}>
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={`${panelClass} p-4 md:p-8`}>
              <h2 className={sectionTitleClass}>Tous les joueurs</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 text-right">
                    <th className="text-left font-bold pb-3 w-10">#</th>
                    <th className="text-left font-bold pb-3">Joueur</th>
                    <th className="font-bold pb-3 px-2">Parties</th>
                    <th className="font-bold pb-3 px-2">V</th>
                    <th className="font-bold pb-3 px-2">D</th>
                    <th className="font-bold pb-3 px-2">%</th>
                    <th className="font-bold pb-3 px-2 hidden md:table-cell">Crapettes</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const isMe = p.username === me.username;
                    return (
                      <tr key={p.username} className={`border-t border-white/5 text-right ${isMe ? 'bg-amber-500/10' : ''}`}>
                        <td className="text-left py-3 pl-1 font-black text-gray-400">{MEDALS[p.rank - 1] ?? p.rank}</td>
                        <td className={`text-left py-3 font-bold truncate max-w-32 ${isMe ? 'text-amber-300' : 'text-white'}`}>
                          {p.username}{isMe && <span className="ml-1 text-xs text-amber-400/70">(vous)</span>}
                        </td>
                        <td className="py-3 px-2 text-gray-300">{p.games}</td>
                        <td className="py-3 px-2 text-amber-400 font-bold">{p.wins}</td>
                        <td className="py-3 px-2 text-red-400 font-bold">{p.losses}</td>
                        <td className="py-3 px-2 text-white font-bold">{p.winRate}</td>
                        <td className="py-3 pr-1 text-gray-300 hidden md:table-cell">{p.crapettes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {rivalries.length > 0 && (
              <section className={`${panelClass} p-6 md:p-8`}>
                <h2 className={sectionTitleClass}>Rivalités</h2>
                <ul className="flex flex-col gap-3">
                  {rivalries.map((r) => (
                    <li key={`${r.player1}-${r.player2}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
                      <span className={`text-right truncate font-bold ${r.wins1 >= r.wins2 ? 'text-white' : 'text-gray-500'}`}>{r.player1}</span>
                      <span className="px-3 py-1 rounded-lg bg-black/50 border border-white/10 font-black tabular-nums">
                        <span className={r.wins1 > r.wins2 ? 'text-amber-400' : 'text-gray-300'}>{r.wins1}</span>
                        <span className="text-gray-600"> – </span>
                        <span className={r.wins2 > r.wins1 ? 'text-amber-400' : 'text-gray-300'}>{r.wins2}</span>
                      </span>
                      <span className={`truncate font-bold ${r.wins2 >= r.wins1 ? 'text-white' : 'text-gray-500'}`}>{r.player2}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
