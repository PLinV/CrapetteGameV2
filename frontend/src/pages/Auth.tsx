import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import PageLayout, { Suits, inputClass, panelClass, primaryButtonClass } from '../components/PageLayout';

const TEXTS = {
  login: {
    subtitle: 'Prenez place à la table',
    submit: 'Se connecter',
    loading: 'Connexion en cours...',
    switchText: 'Nouveau joueur ?',
    switchLink: { to: '/register', label: 'Créer un compte' },
  },
  register: {
    subtitle: 'Rejoignez la table',
    submit: 'Créer mon compte',
    loading: 'Création en cours...',
    switchText: 'Déjà joueur ?',
    switchLink: { to: '/login', label: 'Se connecter' },
  },
};

// Page de connexion ou d'inscription : seuls les textes et l'endpoint changent.
export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const texts = TEXTS[mode];
  const navigate = useNavigate();
  const location = useLocation();
  // Page protégée demandée avant la connexion (voir RequireAuth) : on y retourne ensuite.
  const from: unknown = location.state?.from;
  const redirectTo = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      navigate(redirectTo, { replace: true });
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
          <h1 className="text-4xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500">
            Crapette Club
          </h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-2">{texts.subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
            <span className="pl-1">Nom d'utilisateur / Pseudo</span>
            <input type="text" required maxLength={20} placeholder="Ex: ElProfesor" value={username}
              onChange={(e) => setUsername(e.target.value)} className={`${inputClass} text-base normal-case tracking-normal`} />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
            <span className="pl-1">Mot de passe</span>
            <input type="password" required minLength={mode === 'register' ? 8 : undefined} maxLength={72} placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} className={`${inputClass} text-base normal-case tracking-normal`} />
          </label>

          {mode === 'login' && (
            <div className="text-right -mt-3 text-xs">
              <button type="button" onClick={() => setShowForgotHelp(!showForgotHelp)}
                className="text-gray-500 hover:text-amber-400 cursor-pointer">
                Mot de passe oublié ?
              </button>
              {showForgotHelp && (
                <p className="mt-2 text-left text-gray-400">
                  Demandez à l'administrateur du site un lien de réinitialisation : il vous permettra de choisir un nouveau mot de passe.
                </p>
              )}
            </div>
          )}

          <button type="submit" disabled={isLoading} className={`${primaryButtonClass} mt-4 p-5 text-base disabled:opacity-70 disabled:cursor-not-allowed`}>
            {isLoading ? texts.loading : texts.submit}
          </button>
        </form>

        <div className="text-center mt-10 pt-6 border-t border-white/5 text-sm text-gray-500">
          {texts.switchText}{' '}
          <Link to={texts.switchLink.to} state={location.state} className="text-amber-500 hover:underline font-bold">
            {texts.switchLink.label}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
