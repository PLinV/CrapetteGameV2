import { useState, type FormEvent } from 'react';
import { fetchWithAuth } from '../services/api';
import { inputClass } from './PageLayout';

const buttonClass =
  'px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs font-bold text-gray-200 cursor-pointer active:scale-95 transition-all';

// Admin : génère un lien de réinitialisation de mot de passe à envoyer à un joueur (valable 1 h, usage unique).
export default function ResetLinkGenerator() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<{ username: string; link: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setCopied(false);
    try {
      const response = await fetchWithAuth('/admin/password-reset', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult({ username: data.username, link: `${window.location.origin}/reset-password#${data.token}` });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Une erreur est survenue.');
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
    } catch {
      setError('Copie impossible : sélectionnez le lien à la main.');
    }
  };

  return (
    <details className="w-full p-4 rounded-2xl bg-black/60 border border-purple-500/40 text-sm">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-purple-200">
        🛠 Mot de passe oublié d'un joueur
      </summary>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input type="text" required maxLength={20} placeholder="Pseudo du joueur" value={username}
          onChange={(e) => setUsername(e.target.value)} className={`${inputClass} p-2 text-sm`} />
        <button type="submit" className={buttonClass}>Générer</button>
      </form>

      {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}

      {result && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-gray-400">
            Lien pour <span className="text-white font-bold">{result.username}</span>, valable 1 h et une seule fois :
          </p>
          <input readOnly value={result.link} onFocus={(e) => e.target.select()}
            className="w-full p-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-gray-300" />
          <button type="button" onClick={copy} className={buttonClass}>
            {copied ? 'Copié ✓' : 'Copier le lien'}
          </button>
        </div>
      )}
    </details>
  );
}
