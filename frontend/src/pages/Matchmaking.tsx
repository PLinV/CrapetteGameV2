import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Matchmaking() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!roomId) return;
    navigate(`/game/${roomId}`); // Juste la navigation !
  };

  const handleJoinRoom = () => {
    if (!roomId) return;
    navigate(`/game/${roomId}`); // Juste la navigation !
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-neutral-950 to-black text-white p-4">
      
      {/* Bouton Retour au menu */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-amber-400 transition-colors group z-50"
      >
        <span className="text-lg transition-transform group-hover:-translate-x-1">←</span>
        Menu Principal
      </Link>

      {/* En-tête / Titre (Style Home) */}
      <div className="text-center mb-12 relative">
        <div className="flex justify-center gap-3 text-3xl text-amber-500/30 mb-6 font-serif select-none">
          <span>♠</span><span>♥</span><span>♦</span><span>♣</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase filter drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          Matchmaking
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Préparez la table</p>
      </div>

      {/* Conteneur principal style "Verre dépoli" (Style Register/Login) */}
      <div className="relative w-full max-w-md bg-black/40 p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-md overflow-hidden flex flex-col gap-6">
        
        {/* Déco : Halo lumineux */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Input */}
        <div className="flex flex-col gap-2 z-10">
          <label className="text-sm font-bold uppercase tracking-wider text-gray-400 pl-1 text-center">
            Nom de la table secrète
          </label>
          <input 
            type="text" 
            placeholder="Ex: Table_Alpha" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-white font-medium placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-lg text-center"
          />
        </div>
        
        {/* Boutons d'action */}
        <div className="flex flex-col gap-4 z-10 mt-2">
          
          {/* Bouton Primaire */}
          <button 
            onClick={handleCreateRoom} 
            className="w-full text-center p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-neutral-950 font-black text-lg uppercase tracking-wider hover:from-amber-400 hover:to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all"
          >
            Créer la table
          </button>
          
          {/* Séparateur */}
          <div className="flex items-center gap-4 my-1">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-500 uppercase font-bold">OU</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* Bouton Secondaire */}
          <button 
            onClick={handleJoinRoom} 
            className="w-full text-center p-4 bg-neutral-900/60 rounded-xl text-gray-300 font-bold border border-neutral-700 text-sm uppercase tracking-wider hover:bg-neutral-800 hover:text-white hover:border-neutral-500 active:scale-95 transition-all"
          >
            Rejoindre la table
          </button>

        </div>
      </div>
    </div>
  );
}