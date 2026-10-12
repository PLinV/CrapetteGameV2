import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout, { Suits, inputClass, panelClass, primaryButtonClass } from '../components/PageLayout';

// La table est créée côté serveur par le premier joueur qui la rejoint.
export default function Matchmaking() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (roomId.trim()) navigate(`/game/${encodeURIComponent(roomId.trim())}`);
  };

  return (
    <PageLayout>
      <div className="text-center mb-12 relative">
        <Suits className="text-amber-500/30 mb-6" />
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase filter drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          Matchmaking
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">Préparez la table</p>
      </div>

      <form onSubmit={handleSubmit} className={`${panelClass} max-w-md p-8 md:p-10 flex flex-col gap-6`}>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <label className="flex flex-col gap-2 z-10 text-sm font-bold uppercase tracking-wider text-gray-400 text-center">
          Nom de la table secrète
          <input type="text" maxLength={30} placeholder="Ex: Table_Alpha" value={roomId} onChange={(e) => setRoomId(e.target.value)}
            className={`${inputClass} text-lg text-center normal-case tracking-normal`} />
        </label>

        <button type="submit" className={`${primaryButtonClass} z-10 mt-2`}>Rejoindre la table</button>
        <p className="z-10 text-xs text-gray-500 text-center">
          Si la table n'existe pas encore, elle est créée et votre ami pourra la rejoindre avec le même nom.
        </p>
      </form>
    </PageLayout>
  );
}
