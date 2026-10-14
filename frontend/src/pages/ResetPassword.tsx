import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import PageLayout, { Suits, inputClass, panelClass, primaryButtonClass } from '../components/PageLayout';

// Page ouverte depuis le lien donné par l'admin : /reset-password#<jeton>.
// Le jeton est après le # pour ne jamais être envoyé au serveur dans l'URL (ni dans ses logs).
export default function ResetPassword() {
  const navigate = useNavigate();
  const [token] = useState(() => window.location.hash.slice(1));
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className={`${panelClass} max-w-lg p-10`}>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-10 relative">
          <Suits className="text-amber-500/40 mb-3" />
          <h1 className="text-3xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
            Nouveau mot de passe
          </h1>
        </div>

        {!token ? (
          <p className="text-center text-gray-400">
            Lien incomplet. Demandez un lien de réinitialisation à l'administrateur.
          </p>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                <span className="pl-1">Nouveau mot de passe</span>
                <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} text-base normal-case tracking-normal`} />
              </label>

              <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                <span className="pl-1">Confirmation</span>
                <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="••••••••"
                  value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={`${inputClass} text-base normal-case tracking-normal`} />
              </label>

              <button type="submit" disabled={isLoading} className={`${primaryButtonClass} mt-4 p-5 text-base disabled:opacity-70 disabled:cursor-not-allowed`}>
                {isLoading ? 'Enregistrement...' : 'Changer mon mot de passe'}
              </button>
            </form>
          </>
        )}

        <div className="text-center mt-10 pt-6 border-t border-white/5 text-sm text-gray-500">
          <Link to="/login" className="text-amber-500 hover:underline font-bold">Retour à la connexion</Link>
        </div>
      </div>
    </PageLayout>
  );
}
