export default function WaitingPopup({ roomId }: { roomId: string }) {
    return (
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="animate-spin text-5xl mb-6">⏳</div>
        <h2 className="text-3xl font-bold text-amber-400 mb-2">En attente d'un adversaire...</h2>
        <p className="text-gray-400">Demandez à votre ami de rejoindre la table : <span className="font-mono text-white bg-gray-800 px-2 py-1 rounded">{roomId}</span></p>
      </div>
    );
}