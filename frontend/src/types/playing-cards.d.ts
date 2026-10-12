// Le paquet ne fournit pas ses types : seules les figures utilisées sont déclarées.
declare module '@letele/playing-cards' {
  import type { FC, SVGProps } from 'react';

  type CardSvg = FC<SVGProps<SVGSVGElement>>;
  export const Sj: CardSvg, Sq: CardSvg, Sk: CardSvg;
  export const Hj: CardSvg, Hq: CardSvg, Hk: CardSvg;
  export const Dj: CardSvg, Dq: CardSvg, Dk: CardSvg;
  export const Cj: CardSvg, Cq: CardSvg, Ck: CardSvg;
}
