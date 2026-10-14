import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { fetchWithAuth } from '../services/api';
import { useCurrentUser, useSetCurrentUser } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import PageLayout, { Suits, inputClass, panelClass, primaryButtonClass, secondaryButtonClass } from '../components/PageLayout';

const AVATAR_SIZE = 256; // côté de l'image envoyée, en pixels
const MAX_FILE_MB = 15;

type Feedback = { ok: boolean; text: string } | null;

// Recadre l'image en carré au centre et la réduit à AVATAR_SIZE px : on n'envoie que quelques dizaines de Ko.
async function resizeToSquare(file: File): Promise<{ blob: Blob; preview: string }> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = AVATAR_SIZE;
  canvas.getContext('2d')!.drawImage(
    bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE,
  );
  bitmap.close();
  // WebP si le navigateur sait l'encoder, sinon il renvoie du PNG : les deux sont acceptés par le serveur.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob) throw new Error();
  return { blob, preview: canvas.toDataURL('image/webp', 0.85) };
}

// Envoie une requête JSON et renvoie le message du serveur (lève une erreur si elle a échoué).
async function send(endpoint: string, method: string, body?: unknown, headers?: HeadersInit): Promise<{ message?: string }> {
  const response = await fetchWithAuth(endpoint, {
    method,
    headers,
    body: body instanceof Blob ? body : body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Une erreur est survenue.');
  return data;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${panelClass} p-6 md:p-8`}>
      <h2 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-5">{title}</h2>
      {children}
    </section>
  );
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return <p className={`mt-4 text-sm font-medium ${feedback.ok ? 'text-green-400' : 'text-red-400'}`}>{feedback.text}</p>;
}

const labelClass = 'flex flex-col gap-2 text-xs font-bold uppercase tracking-wider text-gray-400';
const fieldClass = `${inputClass} p-3 text-base normal-case tracking-normal`;

// Paramètres du compte : photo de profil, pseudo et mot de passe.
export default function Settings() {
  const user = useCurrentUser();
  const setUser = useSetCurrentUser();
  const fileInput = useRef<HTMLInputElement>(null);

  const [avatarFeedback, setAvatarFeedback] = useState<Feedback>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [username, setUsername] = useState(user.username);
  const [usernameFeedback, setUsernameFeedback] = useState<Feedback>(null);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirmation: '' });
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de rechoisir le même fichier
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setAvatarFeedback({ ok: false, text: `Image trop lourde (${MAX_FILE_MB} Mo maximum).` });
      return;
    }
    setIsUploading(true);
    setAvatarFeedback(null);
    try {
      const { blob, preview } = await resizeToSquare(file).catch(() => {
        throw new Error('Impossible de lire cette image.');
      });
      await send('/me/avatar', 'PUT', blob, { 'Content-Type': blob.type });
      setUser({ ...user, avatarUrl: preview });
      setAvatarFeedback({ ok: true, text: 'Photo de profil enregistrée.' });
    } catch (err) {
      setAvatarFeedback({ ok: false, text: (err as Error).message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await send('/me/avatar', 'DELETE');
      setUser({ ...user, avatarUrl: null });
      setAvatarFeedback({ ok: true, text: 'Photo de profil supprimée.' });
    } catch (err) {
      setAvatarFeedback({ ok: false, text: (err as Error).message });
    }
  };

  const handleUsername = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const wanted = username.trim();
    if (wanted === user.username) return;
    try {
      await send('/me/username', 'PATCH', { username: wanted });
      // L'URL de la photo contient le pseudo : on la relit depuis le serveur.
      const me = await (await fetchWithAuth('/me')).json();
      setUser({ ...user, username: me.username, avatarUrl: me.avatarUrl ?? null });
      setUsernameFeedback({ ok: true, text: 'Pseudo modifié.' });
    } catch (err) {
      setUsernameFeedback({ ok: false, text: (err as Error).message });
    }
  };

  const handlePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirmation) {
      setPasswordFeedback({ ok: false, text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    try {
      await send('/me/password', 'PATCH', { currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirmation: '' });
      setPasswordFeedback({ ok: true, text: 'Mot de passe modifié. Vos autres appareils ont été déconnectés.' });
    } catch (err) {
      setPasswordFeedback({ ok: false, text: (err as Error).message });
    }
  };

  const setPassword = (field: keyof typeof passwords) => (e: ChangeEvent<HTMLInputElement>) =>
    setPasswords({ ...passwords, [field]: e.target.value });

  return (
    <PageLayout>
      <div className="w-full max-w-2xl flex flex-col gap-8 py-16">
        <div className="text-center">
          <Suits className="text-amber-500/30 mb-4" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] tracking-widest uppercase">
            Paramètres
          </h1>
        </div>

        <Section title="Photo de profil">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar url={user.avatarUrl} name={user.username} size={112} gold />
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
              <button type="button" disabled={isUploading} onClick={() => fileInput.current?.click()}
                className={`${primaryButtonClass} text-sm py-3 cursor-pointer disabled:opacity-60`}>
                {isUploading ? 'Envoi...' : user.avatarUrl ? 'Changer de photo' : 'Choisir une photo'}
              </button>
              {user.avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar} className={`${secondaryButtonClass} py-3 cursor-pointer`}>
                  Supprimer la photo
                </button>
              )}
              <p className="text-xs text-gray-500">PNG, JPEG ou WebP. L'image est recadrée en carré.</p>
            </div>
          </div>
          <FeedbackLine feedback={avatarFeedback} />
        </Section>

        <Section title="Pseudo">
          <form onSubmit={handleUsername} className="flex flex-col sm:flex-row gap-3">
            <input type="text" required minLength={3} maxLength={20} value={username}
              onChange={(e) => setUsername(e.target.value)} className={fieldClass} />
            <button type="submit" disabled={username.trim() === user.username}
              className={`${primaryButtonClass} sm:w-auto px-6 text-sm cursor-pointer disabled:opacity-40 disabled:cursor-default`}>
              Enregistrer
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">3 à 20 caractères : lettres, chiffres, - et _. Votre historique est conservé.</p>
          <FeedbackLine feedback={usernameFeedback} />
        </Section>

        <Section title="Mot de passe">
          <form onSubmit={handlePassword} className="flex flex-col gap-4">
            <label className={labelClass}>
              Mot de passe actuel
              <input type="password" required autoComplete="current-password" value={passwords.current}
                onChange={setPassword('current')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Nouveau mot de passe
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={passwords.next}
                onChange={setPassword('next')} className={fieldClass} />
            </label>
            <label className={labelClass}>
              Confirmation
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={passwords.confirmation}
                onChange={setPassword('confirmation')} className={fieldClass} />
            </label>
            <button type="submit" className={`${primaryButtonClass} text-sm py-3 cursor-pointer`}>Changer le mot de passe</button>
          </form>
          <FeedbackLine feedback={passwordFeedback} />
        </Section>
      </div>
    </PageLayout>
  );
}
