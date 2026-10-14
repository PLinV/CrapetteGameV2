import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';
import PageLayout, { Suits, primaryButtonClass, secondaryButtonClass } from '../components/PageLayout';
import ResetLinkGenerator from '../components/ResetLinkGenerator';

export default function Home() {
  const [username, setUsername] = useState<string | null>(null); // null = non connecté
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUsername(data?.username ?? null);
        setIsAdmin(!!data?.isAdmin);
      })
      .catch((err) => console.error('Serveur injoignable :', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetchWithAuth('/logout', { method: 'POST' });
    setUsername(null);
    setIsAdmin(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-amber-500 animate-pulse font-bold tracking-widest uppercase">Vérification...</div>
      </div>
    );
  }

  return (
    <PageLayout backLink={false}>
      <div className="text-center mb-16 relative">
        <Suits className="text-amber-500/30 mb-6" />
        <h1 className="text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase filter drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          Crapette
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Le jeu de cartes de référence</p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {username ? (
          <div className="flex flex-col items-center gap-6">
            <div className="text-sm text-amber-400 font-bold uppercase tracking-widest text-center">
              Bienvenue à la table,<br />
              <span className="text-white text-lg">{username}</span>
            </div>

            <Link
              to="/matchmaking"
              className="w-full text-center px-8 py-5 bg-gradient-to-b from-[#2a723f] to-[#113a1e] rounded-xl text-3xl font-black border-2 border-[#d4af37] text-[#ffe8a1] uppercase tracking-wider hover:scale-105 hover:shadow-[0_0_30px_rgba(42,114,63,0.6)] active:scale-95 transition-all"
            >
              Jouer
            </Link>

            <Link to="/history" className={secondaryButtonClass}>Historique</Link>
            <Link to="/leaderboard" className={secondaryButtonClass}>Classement</Link>

            <button
              onClick={handleLogout}
              className="text-xs text-gray-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>

            {isAdmin && <ResetLinkGenerator />}
          </div>
        ) : (
          <>
            <Link to="/login" className={primaryButtonClass}>Se connecter</Link>
            <Link to="/register" className={secondaryButtonClass}>Créer un compte</Link>
          </>
        )}
      </div>
    </PageLayout>
  );
}
