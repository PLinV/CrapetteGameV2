import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchWithAuth } from '../services/api';
import { primaryButtonClass, secondaryButtonClass } from '../components/PageLayout';
import ResetLinkGenerator from '../components/ResetLinkGenerator';
import Avatar from '../components/Avatar';
import PausedGameBanner from '../components/PausedGameBanner';
import CardFan from '../components/CardFan';

type Me = { username: string; isAdmin: boolean; avatarUrl: string | null; canSeeForAnna: boolean };
type Summary = { games: number; wins: number; winRate: number; currentStreak: number };
const json = (res: Response) => (res.ok ? res.json() : null);

const TILES = [
  { to: '/history', icon: '📜', title: 'Historique', text: 'Vos parties, vos séries et vos face-à-face.' },
  { to: '/leaderboard', icon: '🏆', title: 'Classement', text: 'Le podium et les rivalités de tous les joueurs.' },
  { to: '/settings', icon: '⚙️', title: 'Paramètres', text: 'Photo de profil, pseudo et mot de passe.' },
];

const HOW_TO_PLAY = [
  { icon: '🃏', title: 'Une table, deux joueurs', text: 'Créez une partie, publique ou avec mot de passe, ou rejoignez celle d\'un ami.' },
  { icon: '🏁', title: 'Videz votre jeu', text: 'Montez vos cartes sur les fondations : le premier sans crapette, talon ni défausse gagne.' },
  { icon: '🚨', title: 'Criez « Crapette ! »', text: 'Votre adversaire oublie de monter une carte ? Sanctionnez la faute et reprenez la main.' },
];

function StatItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <span className={`text-2xl md:text-3xl font-black ${highlight ? 'text-amber-400' : 'text-white'}`}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">{label}</span>
    </div>
  );
}

export default function Home() {
  const [me, setMe] = useState<Me | null>(null); // null = non connecté
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);

  useEffect(() => {
    fetchWithAuth('/me')
      .then(json)
      .then(async (data: Me | null) => {
        setMe(data);
        setIsLoading(false);
        if (!data) return;
        // Infos secondaires, chargées après l'affichage de la page.
        const [stats, leaderboard] = await Promise.all([
          fetchWithAuth('/stats').then(json),
          fetchWithAuth('/leaderboard').then(json),
        ]);
        if (stats) setSummary(stats.summary);
        const mine = leaderboard?.players.find((p: { username: string }) => p.username === data.username);
        if (mine) setRank({ rank: mine.rank, total: leaderboard.players.length });
      })
      .catch((err) => {
        console.error('Serveur injoignable :', err);
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetchWithAuth('/logout', { method: 'POST' });
    setMe(null);
    setSummary(null);
    setRank(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0f0e]">
        <div className="text-amber-500 animate-pulse font-bold tracking-widest uppercase">Vérification...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0f0e] text-white">
      {/* Fond : halo de tapis vert et grands symboles estompés. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(42,114,63,0.45)_0%,_rgba(17,58,30,0.15)_45%,_transparent_70%)]" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-24 left-[6%] text-[160px] text-white/[0.025] font-serif rotate-[-15deg]">♠</span>
        <span className="absolute top-[45%] right-[5%] text-[200px] text-white/[0.025] font-serif rotate-[12deg]">♥</span>
        <span className="absolute bottom-10 left-[12%] text-[140px] text-white/[0.025] font-serif rotate-[8deg]">♦</span>
        <span className="absolute top-10 right-[22%] text-[110px] text-white/[0.02] font-serif rotate-[-6deg]">♣</span>
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="" className="w-10 h-10" />
          <span className="hidden sm:inline font-black uppercase tracking-[0.3em] text-sm text-[#e8cf8a]">Crapette</span>
        </div>
        {me && (
          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/settings" className="flex items-center gap-3 rounded-full pl-1 pr-4 py-1 bg-white/5 border border-white/10 hover:border-amber-500/50 transition-colors">
              <Avatar url={me.avatarUrl} name={me.username} size={36} gold />
              <span className="font-bold text-sm max-w-32 truncate">{me.username}</span>
            </Link>
            <button onClick={handleLogout} title="Se déconnecter"
              className="text-xs text-gray-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors cursor-pointer">
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 pb-16 flex flex-col items-center">
        <section className="flex flex-col items-center text-center mt-2 md:mt-6">
          <CardFan />
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 sm:mt-8 text-5xl sm:text-6xl md:text-8xl font-black tracking-[0.1em] sm:tracking-[0.15em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#fff3c4] via-[#e8cf8a] to-[#b8902f] drop-shadow-[0_0_30px_rgba(212,175,55,0.25)]"
          >
            Crapette
          </motion.h1>
        </section>

        {me ? (
          <div className="w-full max-w-3xl flex flex-col items-center gap-8 mt-10">
            <PausedGameBanner />

            <Link
              to="/matchmaking"
              className="group relative w-full max-w-md text-center px-8 py-6 rounded-2xl bg-gradient-to-b from-[#2f7d46] to-[#113a1e] border-2 border-[#d4af37] shadow-[0_15px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_0_45px_rgba(42,114,63,0.7)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <span className="block text-4xl font-black uppercase tracking-[0.2em] text-[#ffe8a1]">Jouer</span>
              <span className="block mt-1 text-xs uppercase tracking-widest text-[#ffe8a1]/60">Créer ou rejoindre une partie</span>
            </Link>

            {/* Page personnalisée : bouton visible seulement par les comptes autorisés (le serveur vérifie aussi). */}
            {me.canSeeForAnna && (
              <Link
                to="/pour-anna"
                aria-label="Une surprise"
                className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-rose-600/80 to-pink-500/80 border border-rose-300/50 shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.6)] hover:-translate-y-0.5 transition-all"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">😉</span>
                <span className="text-2xl group-hover:scale-125 transition-transform">❤️</span>
              </Link>
            )}

            {summary && (
              <div className="w-full max-w-2xl rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm py-5 px-4">
                {summary.games === 0 ? (
                  <p className="text-center text-sm text-gray-400">Pas encore de partie terminée : votre bilan s'affichera ici.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 divide-white/10 md:divide-x">
                    <StatItem label="Victoires" value={String(summary.wins)} />
                    <StatItem label="Taux de victoire" value={`${summary.winRate} %`} highlight />
                    <StatItem
                      label="Série en cours"
                      value={summary.currentStreak > 0 ? `🔥 ${summary.currentStreak}` : summary.currentStreak < 0 ? `${-summary.currentStreak} D` : '—'}
                    />
                    <StatItem label={rank ? `Classement / ${rank.total}` : 'Classement'} value={rank ? `#${rank.rank}` : '—'} />
                  </div>
                )}
              </div>
            )}

            <nav className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TILES.map((tile) => (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.06] hover:-translate-y-1 transition-all"
                >
                  <span className="text-3xl">{tile.icon}</span>
                  <span className="block mt-3 font-black uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">{tile.title}</span>
                  <span className="block mt-1 text-sm text-gray-500">{tile.text}</span>
                </Link>
              ))}
            </nav>

            {me.isAdmin && (
              <div className="w-full max-w-md">
                <ResetLinkGenerator />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-14 mt-10">
            <div className="w-full max-w-sm flex flex-col gap-4">
              <Link to="/login" className={primaryButtonClass}>Se connecter</Link>
              <Link to="/register" className={secondaryButtonClass}>Créer un compte</Link>
            </div>

            <section className="w-full">
              <h2 className="text-center text-sm font-black uppercase tracking-[0.3em] text-amber-500 mb-6">Comment jouer</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HOW_TO_PLAY.map((step) => (
                  <div key={step.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="text-3xl">{step.icon}</span>
                    <span className="block mt-3 font-black uppercase tracking-wider text-white">{step.title}</span>
                    <span className="block mt-1 text-sm text-gray-500">{step.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
