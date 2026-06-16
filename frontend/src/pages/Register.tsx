import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // états pour gérer l'affichage des erreurs et du chargement
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // hook pour rediriger le joueur après l'inscription
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // On efface les anciennes erreurs
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // autorise la réception et l'envoi de cookies
        credentials: 'include', 
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // si le backend renvoie une erreur (ex: pseudo déjà pris, status 400 ou 409)
        throw new Error(data.message || "une erreur est survenue lors de l'inscription.");
      }

      if (data.confirm) {
        console.log("compte créé et connecté");
        // on redirige vers le menu principal
        navigate('/');
      }

    } catch (err: any) {
      console.error("erreur Fetch Register:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-neutral-950 to-black text-gray-100 p-4">
      
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-amber-400 transition-colors group z-50"
      >
        <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
        Menu Principal
      </Link>

      {/* conteneur principal */}
      <div className="relative w-full max-w-lg bg-black/40 p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-md overflow-hidden">
        
        {/* Déco : Halo lumineux */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* En-tête */}
        <div className="text-center mb-10 relative">
          <div className="flex justify-center gap-3 text-3xl text-amber-500/40 mb-3 font-serif select-none">
            <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
            Crapette Club
          </h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">Rejoignez la table</p>
        </div>

        {/* Affichage des erreurs si la requête échoue */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Champ Pseudo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400 pl-1">
              Nom d'utilisateur / Pseudo
            </label>
            <input 
              type="text" 
              required
              placeholder="Ex: ElProfesor"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-base"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold uppercase tracking-wider text-gray-400 pl-1">
              Mot de passe
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-base"
            />
          </div>

          {/* Bouton de soumission */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black p-5 rounded-xl text-base uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]
              ${isLoading ? 'opacity-70 cursor-not-allowed scale-100' : 'active:scale-[0.98]'}`}
          >
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        {/* Pied de page / Connexion */}
        <div className="text-center mt-10 pt-6 border-t border-white/5 text-sm text-gray-500">
          Déjà joueur ?{' '}
          <Link to="/login" className="text-amber-500 hover:underline font-bold transition-all">
            Se connecter
          </Link>
        </div>

      </div>
    </div>
  );
}