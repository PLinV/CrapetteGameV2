// Affiché pendant une coupure réseau : on ne peut plus jouer, et la partie attend le retour du joueur.
export default function ConnectionLost() {
  return (
    <div className="absolute inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center" role="alert">
      <div className="mx-4 max-w-md px-8 py-6 rounded-3xl bg-neutral-900/95 border-2 border-red-500/60 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-center">
        <div className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-red-400/30 border-t-red-400 animate-spin" />
        <p className="text-xl font-black uppercase tracking-widest text-red-400">Connexion perdue</p>
        <p className="mt-3 text-sm text-gray-300">
          Reconnexion en cours… La partie est en pause et reprendra dès le retour de la connexion.
        </p>
      </div>
    </div>
  );
}
