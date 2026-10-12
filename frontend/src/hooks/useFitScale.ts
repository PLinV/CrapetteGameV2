import { useLayoutEffect, useState, type RefObject } from 'react';

// Échelle à appliquer à un élément de taille fixe pour qu'il tienne entièrement dans la fenêtre.
export function useFitScale(ref: RefObject<HTMLElement | null>, margin = 0.98) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      // offsetWidth/Height donnent la taille réelle, sans la transformation scale.
      setScale(Math.min(window.innerWidth / el.offsetWidth, window.innerHeight / el.offsetHeight) * margin);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref, margin]);

  return scale;
}
