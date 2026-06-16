import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../services/api';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetchWithAuth('/me', { method: 'GET' });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUsername(data.username);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Erreur serveur :", err);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, []);

  const handleLogout = async () => {
    try {
      // Pareil pour la déconnexion, c'est super propre
      await fetchWithAuth('/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setUsername('');
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
    }
  };

  // petit écran d'attente pendant qu'on vérifie le token
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-amber-500 animate-pulse font-bold tracking-widest uppercase">
          Vérification...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-neutral-950 to-black text-white p-4">
      
      {/* En-tête / Titre */}
      <div className="text-center mb-16 relative">
        <div className="flex justify-center gap-3 text-3xl text-amber-500/30 mb-6 font-serif select-none">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>
        <h1 className="text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase filter drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          Crapette
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Le jeu de cartes de référence</p>
      </div>

      {/* Zone d'action dynamique */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        
        {isLoggedIn ? (
          // --- VUE JOUEUR CONNECTÉ ---
          <div className="flex flex-col items-center gap-6">
            <div className="text-sm text-amber-400 font-bold uppercase tracking-widest text-center">
              Bienvenue à la table,<br/>
              <span className="text-white text-lg">{username}</span>
            </div>
            
            <Link 
              to="/game" 
              className="w-full text-center px-8 py-5 bg-gradient-to-b from-[#2a723f] to-[#113a1e] rounded-xl text-3xl font-black border-2 border-[#d4af37] text-[#ffe8a1] uppercase tracking-wider hover:scale-105 hover:shadow-[0_0_30px_rgba(42,114,63,0.6)] active:scale-95 transition-all"
            >
              JOUER
            </Link>

            <button 
              onClick={handleLogout} 
              className="text-xs text-gray-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        ) : (
          // --- VUE VISITEUR NON CONNECTÉ ---
          <>
            <Link 
              to="/login" 
              className="w-full text-center p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-neutral-950 font-black text-lg uppercase tracking-wider hover:from-amber-400 hover:to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
            >
              Se connecter
            </Link>
            
            <Link 
              to="/register" 
              className="w-full text-center p-4 bg-neutral-900/60 rounded-xl text-gray-300 font-bold border border-neutral-700 text-sm uppercase tracking-wider hover:bg-neutral-800 hover:text-white hover:border-neutral-500 active:scale-95 transition-all"
            >
              Créer un compte
            </Link>
          </>
        )}

      </div>
    </div>
  );
}