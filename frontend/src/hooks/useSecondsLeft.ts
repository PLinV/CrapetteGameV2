import { useEffect, useState } from 'react';

// Secondes restantes avant `readyAt` (heure en ms), mises à jour pendant le compte à rebours seulement.
export function useSecondsLeft(readyAt: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= readyAt) clearInterval(timer);
    };
    const first = setTimeout(tick, 0); // nouvelle échéance : le compte à rebours s'affiche tout de suite
    if (readyAt > Date.now()) timer = setInterval(tick, 250);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [readyAt]);

  return Math.max(0, Math.ceil((readyAt - now) / 1000));
}
