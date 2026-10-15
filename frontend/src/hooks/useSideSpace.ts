import { useLayoutEffect, useState, type RefObject } from 'react';

// Largeur laissée libre à droite d'un élément de taille fixe, quand il est mis à l'échelle pour remplir
// toute la hauteur de son conteneur (les bandes vides à côté du plateau). Recalculée au redimensionnement.
export function useSideSpace(ref: RefObject<HTMLElement | null>, containerRef: RefObject<HTMLElement | null>, margin = 0.98) {
  const [space, setSpace] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const update = () => {
      // offsetWidth/Height donnent la taille réelle, sans la transformation scale.
      const scale = (container.clientHeight / el.offsetHeight) * margin;
      setSpace(Math.max(0, Math.floor(container.clientWidth - el.offsetWidth * scale)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [ref, containerRef, margin]);

  return space;
}
