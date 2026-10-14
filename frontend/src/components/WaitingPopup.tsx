import { useState } from 'react';

// Écran d'attente d'un adversaire, avec le lien de la table à envoyer à un ami.
export default function WaitingPopup({ name, locked }: { name: string; locked: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="animate-spin text-5xl mb-2">⏳</div>
      <h2 className="text-3xl font-bold text-amber-400">En attente d'un adversaire...</h2>
      <p className="text-gray-300 text-lg">
        {locked && '🔒 '}<span className="font-bold text-white">{name}</span>
      </p>
      <p className="text-gray-400 max-w-md">
        Votre partie apparaît dans la liste du menu « Jouer ». Vous pouvez aussi envoyer le lien à un ami
        {locked && ', avec le mot de passe'}.
      </p>
      <button
        onClick={copyLink}
        className="mt-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-sm font-bold text-gray-200 cursor-pointer active:scale-95 transition-all"
      >
        {copied ? 'Lien copié ✓' : 'Copier le lien de la partie'}
      </button>
    </div>
  );
}
