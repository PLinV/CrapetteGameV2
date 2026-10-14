import { useLayoutEffect, useState, type RefObject } from 'react';

// Échelle à appliquer à un élément de taille fixe pour qu'il tienne entièrement dans son conteneur.
export function useFitScale(ref: RefObject<HTMLElement | null>, containerRef: RefObject<HTMLElement | null>, margin = 0.98) {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const update = () => {
      // offsetWidth/Height donnent la taille réelle, sans la transformation scale.
      setScale(Math.min(container.clientWidth / el.offsetWidth, container.clientHeight / el.offsetHeight) * margin);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [ref, containerRef, margin]);

  return scale;
}
