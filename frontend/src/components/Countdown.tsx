import { useEffect, useRef, useState } from 'react';

// Temps restant avant `deadline` (heure en ms), au format m:ss, mis à jour chaque seconde.
// `onEnd` est appelé une fois, quand le compte à rebours arrive à zéro.
export default function Countdown({ deadline, onEnd }: { deadline: number; onEnd?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  useEffect(() => {
    if (seconds === 0) {
      onEndRef.current?.();
      return;
    }
    const timer = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(timer);
  }, [seconds, now]);

  return <span className="tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>;
}
