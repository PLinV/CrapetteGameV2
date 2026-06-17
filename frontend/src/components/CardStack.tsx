export const getGridPlacement = (id: string) => {
  const placements: Record<string, { gridColumn: number, gridRow: number }> = {
    '41': { gridColumn: 2, gridRow: 2 }, '42': { gridColumn: 2, gridRow: 3 }, '43': { gridColumn: 2, gridRow: 4 }, '44': { gridColumn: 2, gridRow: 5 },
    '51': { gridColumn: 24, gridRow: 2 }, '52': { gridColumn: 24, gridRow: 3 }, '53': { gridColumn: 24, gridRow: 4 }, '54': { gridColumn: 24, gridRow: 5 },
    '31': { gridColumn: 8, gridRow: 3 }, '32': { gridColumn: 12, gridRow: 3 }, '33': { gridColumn: 16, gridRow: 3 }, '34': { gridColumn: 20, gridRow: 3 },
    '35': { gridColumn: 8, gridRow: 4 }, '36': { gridColumn: 12, gridRow: 4 }, '37': { gridColumn: 16, gridRow: 4 }, '38': { gridColumn: 20, gridRow: 4 },
    '11': { gridColumn: 10, gridRow: 1 }, '12': { gridColumn: 14, gridRow: 1 }, '13': { gridColumn: 18, gridRow: 1 },
    '21': { gridColumn: 10, gridRow: 6 }, '22': { gridColumn: 14, gridRow: 6 }, '23': { gridColumn: 18, gridRow: 6 },
  };
  return placements[id] || { gridColumn: 1, gridRow: 1 };
};

type CardStackProps = {
  zoneId: string;
};

export default function CardStack({ zoneId }: CardStackProps) {
  const gridPlacement = getGridPlacement(zoneId);
  const isHorizontal = zoneId.startsWith('4') || zoneId.startsWith('5');

  return (
    <div
      id={zoneId}
      className={`zone bg-black/20 border-2 border-dashed border-[#d4af37]/30 rounded-lg relative flex justify-center items-center ${
        isHorizontal ? 'w-[160px] h-[110px]' : 'w-[110px] h-[160px]'
      }`}
      style={{
        gridColumn: gridPlacement.gridColumn,
        gridRow: gridPlacement.gridRow,
        placeSelf: 'center'
      }}
    />
  );
}