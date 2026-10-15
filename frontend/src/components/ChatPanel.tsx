import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { ChatMessage } from '../hooks/useGame';

type ChatPanelProps = {
  messages: ChatMessage[];
  mySeat: 1 | 2 | null;
  onSend: (text: string) => void;
  onClose: () => void;
  overlay: boolean; // petit écran : le panneau passe par-dessus le plateau
  width?: number; // grand écran : largeur de la bande libre à droite du plateau
  headerAction?: ReactNode; // bouton affiché dans l'en-tête (proposer le nul)
};

const MAX_LENGTH = 300; // comme le serveur
const REACTIONS = ['👍', '😂', '😮', '😡', '❤️'];

const formatTime = (at: number) => new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Chat entre les deux joueurs de la table.
export default function ChatPanel({ messages, mySeat, onSend, onClose, overlay, width, headerAction }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Toujours afficher le dernier message.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <aside
      style={overlay ? undefined : { width }}
      className={`z-[100] flex flex-col bg-neutral-950/95 border-l border-white/10 select-text ${
        overlay ? 'absolute inset-y-0 right-0 w-full max-w-sm shadow-[-20px_0_60px_rgba(0,0,0,0.6)]' : 'relative shrink-0'
      }`}
    >
      <header className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-white/10">
        <span className="text-sm font-black uppercase tracking-widest text-amber-400">💬 Discussion</span>
        <span className="ml-auto mr-2">{headerAction}</span>
        <button
          onClick={onClose}
          aria-label="Fermer la discussion"
          className="w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </header>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-gray-500">Aucun message pour l'instant. Dites bonjour !</p>
        )}
        {messages.map((message) => {
          const mine = message.seat === mySeat;
          return (
            <div key={message.id} className={`max-w-[85%] flex flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="px-1 text-[11px] text-gray-500">
                {mine ? 'Vous' : message.username} · {formatTime(message.at)}
              </span>
              <p
                className={`px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap [overflow-wrap:anywhere] ${
                  mine ? 'bg-amber-500 text-black rounded-br-sm' : 'bg-neutral-800 text-gray-100 rounded-bl-sm'
                }`}
              >
                {message.text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 px-3 pt-2 flex flex-wrap gap-1.5 border-t border-white/10">
        {REACTIONS.map((reaction) => (
          <button
            key={reaction}
            onClick={() => onSend(reaction)}
            className="min-w-9 h-9 px-2 rounded-full bg-white/5 hover:bg-white/15 text-lg font-black text-amber-300 transition-colors cursor-pointer"
          >
            {reaction}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="shrink-0 p-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={MAX_LENGTH}
          placeholder="Votre message…"
          aria-label="Votre message"
          className="flex-1 min-w-0 px-4 py-2 rounded-full bg-neutral-800 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="px-4 rounded-full bg-amber-500 text-sm font-black text-black hover:bg-amber-400 disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          Envoyer
        </button>
      </form>
    </aside>
  );
}
