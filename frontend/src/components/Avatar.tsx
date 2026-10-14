type AvatarProps = {
  url: string | null;
  name: string;
  size: number; // en pixels
  gold?: boolean; // cercle doré (le joueur connecté)
  className?: string;
};

// Photo de profil ronde, ou l'initiale du pseudo s'il n'y en a pas.
export default function Avatar({ url, name, size, gold = false, className = '' }: AvatarProps) {
  const ring = gold ? 'border-[#ffe8a1]' : 'border-neutral-500';
  const style = { width: size, height: size, fontSize: size * 0.45 };

  if (url) {
    return <img src={url} alt={name} style={style} className={`shrink-0 rounded-full object-cover border-2 ${ring} ${className}`} />;
  }
  return (
    <div
      style={style}
      className={`shrink-0 rounded-full flex items-center justify-center font-black uppercase border-2 ${ring} ${
        gold ? 'bg-gradient-to-b from-[#ffe8a1] to-[#d4af37] text-[#3e2723]' : 'bg-gradient-to-b from-neutral-600 to-neutral-800 text-white'
      } ${className}`}
    >
      {name[0] ?? '?'}
    </div>
  );
}
