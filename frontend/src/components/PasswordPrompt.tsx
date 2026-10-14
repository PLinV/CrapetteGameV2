import { useState, type FormEvent } from 'react';
import { inputClass, primaryButtonClass, secondaryButtonClass } from './PageLayout';

type PasswordPromptProps = {
  name: string;
  wrong: boolean; // le mot de passe donné était faux
  onSubmit: (password: string) => void;
  onCancel: () => void;
};

// Demande le mot de passe d'une partie protégée avant de s'asseoir.
export default function PasswordPrompt({ name, wrong, onSubmit, onCancel }: PasswordPromptProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 rounded-3xl bg-neutral-950 border border-white/10 shadow-2xl flex flex-col gap-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl font-black text-white">{name}</h2>
          <p className="text-sm text-gray-400 mt-1">Cette partie est protégée par un mot de passe.</p>
        </div>
        {wrong && <p className="text-sm text-red-400 text-center font-medium">Mot de passe incorrect.</p>}
        <input type="password" required autoFocus maxLength={50} placeholder="Mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)} className={`${inputClass} p-3 text-base`} />
        <button type="submit" className={`${primaryButtonClass} text-sm py-3 cursor-pointer`}>Rejoindre</button>
        <button type="button" onClick={onCancel} className={`${secondaryButtonClass} py-3 cursor-pointer`}>Retour</button>
      </form>
    </div>
  );
}
