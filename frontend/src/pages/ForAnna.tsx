import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Début de l'histoire : 14 octobre 2024 à 20h00 (heure de Paris, encore à l'heure d'été).
const START = new Date('2024-10-14T20:00:00+02:00');

const HEARTS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100, // réparti sur la largeur
  size: 16 + ((i * 13) % 28),
  duration: 9 + ((i * 7) % 8),
  delay: (i * 1.3) % 10,
}));

// Temps écoulé en années, mois, jours, heures, minutes et secondes, compté sur le calendrier :
// on ajoute des mois entiers, puis des jours entiers (les mois de 28 à 31 jours et les
// changements d'heure sont donc respectés), puis le reste en heures, minutes, secondes.
function elapsedSince(from: Date, to: Date) {
  const addMonths = (date: Date, count: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + count);
    return d;
  };
  const addDays = (date: Date, count: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + count);
    return d;
  };

  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (addMonths(from, months) > to) months--;
  const afterMonths = addMonths(from, months);

  let days = Math.floor((to.getTime() - afterMonths.getTime()) / 86_400_000);
  if (addDays(afterMonths, days) > to) days--;
  const afterDays = addDays(afterMonths, days);

  const seconds = Math.floor((to.getTime() - afterDays.getTime()) / 1000);
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days,
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

// Heure actuelle, mise à jour chaque seconde, uniquement quand la page est visible à l'écran
// (onglet en arrière-plan ou écran éteint : rien ne tourne, et tout est recalculé au retour).
function useNowWhileVisible() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), 1000);
    };
    const onVisibilityChange = () => (document.hidden ? clearInterval(timer) : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return now;
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) => (count > 1 ? pluralForm : singular);

// Page personnalisée : 2 ans de relation et le temps passé ensemble, en direct.
export default function ForAnna() {
  const now = useNowWhileVisible();
  const t = elapsedSince(START, now);

  const units = [
    { id: 'years', value: t.years, label: plural(t.years, 'an') },
    { id: 'months', value: t.months, label: 'mois' },
    { id: 'days', value: t.days, label: plural(t.days, 'jour') },
    { id: 'hours', value: t.hours, label: plural(t.hours, 'heure') },
    { id: 'minutes', value: t.minutes, label: plural(t.minutes, 'minute') },
    { id: 'seconds', value: t.seconds, label: plural(t.seconds, 'seconde') },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#14060b] text-white flex items-center justify-center px-4 py-16">
      {/* Fond : halo rose et cœurs qui montent doucement. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(190,24,93,0.35)_0%,_rgba(120,10,50,0.12)_45%,_transparent_70%)]" />
        {HEARTS.map((heart, i) => (
          <motion.span
            key={i}
            className="absolute bottom-[-60px] text-rose-500/30 select-none"
            style={{ left: `${heart.left}%`, fontSize: heart.size }}
            animate={{ y: [0, -1200], opacity: [0, 1, 1, 0], x: [0, 20, -20, 0] }}
            transition={{ duration: heart.duration, delay: heart.delay, repeat: Infinity, ease: 'linear' }}
          >
            ♥
          </motion.span>
        ))}
      </div>

      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          <motion.div
            className="text-7xl mb-6 inline-block"
            animate={{ scale: [1, 1.15, 1, 1.1, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            ❤️
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-br from-[#ffd6e3] via-[#ff8fb1] to-[#e8cf8a] drop-shadow-[0_0_30px_rgba(255,105,150,0.3)]">
            2 ans de relation c'est beau je tuberlupe !!
          </h1>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="rounded-3xl bg-black/40 border border-rose-300/20 backdrop-blur-md p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          <p className="text-center text-xs sm:text-sm uppercase tracking-[0.25em] text-rose-200/70 mb-6">
            Ensemble depuis le 14 octobre 2024 à 20h00
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {units.map((unit) => (
              <div key={unit.id} className="flex flex-col items-center py-4 rounded-2xl bg-rose-950/40 border border-rose-300/10">
                <span className="text-3xl sm:text-5xl font-black tabular-nums text-white">{unit.value}</span>
                <span className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-200/70">{unit.label}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
