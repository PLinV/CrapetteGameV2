import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      
      <h1 className="text-6xl font-black mb-12 text-[#d4af37] tracking-widest uppercase">
        Crapette
      </h1>

      <Link 
        to="/game" 
        className="px-10 py-4 bg-gradient-to-b from-[#2a723f] to-[#113a1e] rounded-xl text-3xl font-bold border-2 border-[#d4af37] hover:scale-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all"
      >
        JOUER
      </Link>
      
    </div>
  );
}