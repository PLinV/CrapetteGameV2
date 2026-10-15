import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';
import PageLayout, { Suits, panelClass, primaryButtonClass } from '../components/PageLayout';

type Stats = {
  summary: {
    games: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number; // > 0 : victoires d'affilée, < 0 : défaites d'affilée (un nul l'arrête)
    bestWinStreak: number;
    crapettesCalled: number;
    crapettesSuffered: number;
    averageDurationSeconds: number | null;
    fastestWinSeconds: number | null;
    averageWinMargin: number | null;
    averageCardsLeftOnLoss: number | null;
  };
  opponents: { opponent: string | null; games: number; wins: number; losses: number; draws: number; winRate: number }[];
  recentGames: {
    id: number;
    won: boolean;
    draw: boolean;
    opponent: string | null;
    myCrapettes: number;
    opponentCrapettes: number;
    loserCardsLeft: number;
    turns: number;
    forfeit: boolean;
    durationSeconds: number;
    endedAt: string;
  }[];
};

const DELETED_ACCOUNT = 'Compte supprimé';

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes} min ${String(seconds % 60).padStart(2, '0')}` : `${seconds} s`;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

function streakLabel(streak: number): string {
  if (streak === 0) return '—';
  const count = Math.abs(streak);
  return streak > 0 ? `${count} victoire${count > 1 ? 's' : ''}` : `${count} défaite${count > 1 ? 's' : ''}`;
}

function StatCard({ label, value, hint, highlight = false }: { label: string; value: string | number; hint?: string; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <span className={`text-2xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-red-900/50 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${rate}%` }} />
    </div>
  );
}

const sectionTitleClass = 'text-sm font-black uppercase tracking-widest text-amber-500 mb-4';

// Page « Historique » : statistiques du joueur connecté, bilan contre chaque adversaire et dernières parties.
export default function History() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth('/stats')
      .then(async (res) => {
        if (res.status === 401) {
          navigate('/login');
          return;
        }
        if (!res.ok) throw new Error();
        setStats(await res.json());
      })
      .catch(() => setError("Impossible de charger l'historique."));
  }, [navigate]);

  if (!stats) {
    return (
      <PageLayout>
        <div className={error ? 'text-red-400' : 'text-amber-500 animate-pulse font-bold tracking-widest uppercase'}>
          {error || 'Chargement...'}
        </div>
      </PageLayout>
    );
  }

  const { summary, opponents, recentGames } = stats;

  return (
    <PageLayout>
      <div className="w-full max-w-4xl flex flex-col gap-8 py-16">
        <div className="text-center">
          <Suits className="text-amber-500/30 mb-4" />
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase">
            Historique
          </h1>
        </div>

        {summary.games === 0 ? (
          <div className={`${panelClass} p-10 text-center flex flex-col items-center gap-6`}>
            <p className="text-gray-400">
              Aucune partie enregistrée pour l'instant. Les parties terminées entre deux joueurs connectés apparaîtront ici.
            </p>
            <Link to="/matchmaking" className={`${primaryButtonClass} max-w-xs`}>Jouer</Link>
          </div>
        ) : (
          <>
            <section className={`${panelClass} p-6 md:p-8`}>
              <h2 className={sectionTitleClass}>Bilan</h2>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-400">
                  <span className="text-amber-400 font-bold">{summary.wins} V</span> ·{' '}
                  {summary.draws > 0 && <><span className="text-gray-300 font-bold">{summary.draws} N</span> · </>}
                  <span className="text-red-400 font-bold">{summary.losses} D</span>
                </span>
                <span className="text-3xl font-black text-amber-400">{summary.winRate} %</span>
              </div>
              <WinRateBar rate={summary.winRate} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <StatCard label="Parties jouées" value={summary.games} />
                <StatCard label="Série en cours" value={streakLabel(summary.currentStreak)} highlight={summary.currentStreak > 0} />
                <StatCard label="Meilleure série" value={summary.bestWinStreak} hint="victoires d'affilée" />
                <StatCard label="Crapettes" value={`${summary.crapettesCalled} / ${summary.crapettesSuffered}`} hint="criées / subies" />
                <StatCard label="Durée moyenne" value={formatDuration(summary.averageDurationSeconds)} />
                <StatCard label="Victoire éclair" value={formatDuration(summary.fastestWinSeconds)} hint="la plus rapide" />
                <StatCard label="Marge de victoire" value={summary.averageWinMargin ?? '—'} hint="cartes restant à l'adversaire" />
                <StatCard label="Cartes en défaite" value={summary.averageCardsLeftOnLoss ?? '—'} hint="qu'il vous restait, en moyenne" />
              </div>
            </section>

            <section className={`${panelClass} p-6 md:p-8`}>
              <h2 className={sectionTitleClass}>Face à face</h2>
              <div className="flex flex-col gap-4">
                {opponents.map((o) => (
                  <div key={o.opponent ?? ''} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                      <span className="font-bold text-white truncate">{o.opponent ?? DELETED_ACCOUNT}</span>
                      <span className="text-gray-400 shrink-0">
                        {o.games} partie{o.games > 1 ? 's' : ''} · <span className="text-amber-400 font-bold">{o.wins} V</span> ·{' '}
                        {o.draws > 0 && <><span className="text-gray-300 font-bold">{o.draws} N</span> ·{' '}</>}
                        <span className="text-red-400 font-bold">{o.losses} D</span> · {o.winRate} %
                      </span>
                    </div>
                    <WinRateBar rate={o.winRate} />
                  </div>
                ))}
              </div>
            </section>

            <section className={`${panelClass} p-6 md:p-8`}>
              <h2 className={sectionTitleClass}>Dernières parties</h2>
              <ul className="flex flex-col divide-y divide-white/5">
                {recentGames.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                    <span className={`w-20 font-black uppercase tracking-wider ${g.draw ? 'text-gray-300' : g.won ? 'text-amber-400' : 'text-red-400'}`}>
                      {g.draw ? 'Nul' : g.won ? 'Victoire' : 'Défaite'}
                    </span>
                    <span className="flex-1 min-w-32 text-white">
                      contre <span className="font-bold">{g.opponent ?? DELETED_ACCOUNT}</span>
                    </span>
                    <span className="text-gray-400">
                      {g.draw
                        ? 'match nul accepté'
                        : g.forfeit
                        ? g.won ? 'abandon adverse (forfait)' : 'défaite par forfait'
                        : g.won ? `il lui restait ${g.loserCardsLeft} cartes` : `il vous restait ${g.loserCardsLeft} cartes`}
                    </span>
                    <span className="text-gray-500">{formatDuration(g.durationSeconds)} · {g.turns} tour{g.turns > 1 ? 's' : ''}</span>
                    <span className="text-gray-600 text-xs w-full md:w-auto">{formatDate(g.endedAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
