import { useEffect, useState } from 'react';

// Temps restant avant `deadline` (heure en ms), au format m:ss, mis à jour chaque seconde.
export default function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return <span className="tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>;
}
