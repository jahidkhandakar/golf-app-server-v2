/**
 * Unofficial Indoor Handicap (spec §13): the same WHS differential formula as
 * outdoor, calculated from the virtual course rating and slope the simulator
 * displays. Established at 3 rounds, fully independent of any club handicap.
 */

/** Score differential for one round: (113 / slope) * (gross - courseRating). */
export function differential(
  gross: number,
  courseRating: number,
  slope: number,
): number {
  if (!slope) return 0;
  return (113 / slope) * (gross - courseRating);
}

/** How many of the lowest differentials WHS averages, by rounds available. */
const lowestUsed = (n: number): number => {
  if (n < 3) return 0;
  if (n <= 5) return 1;
  if (n === 6) return 2;
  if (n <= 8) return 2;
  if (n <= 11) return 3;
  if (n <= 14) return 4;
  if (n <= 16) return 5;
  if (n <= 18) return 6;
  if (n === 19) return 7;
  return 8;
};

/**
 * Indoor handicap index from a player's round differentials. Returns null until
 * established (fewer than 3 rounds). Averages the lowest N differentials per the
 * WHS table, rounded to one decimal.
 */
export function indoorHandicapIndex(differentials: number[]): number | null {
  if (differentials.length < 3) return null;
  const used = lowestUsed(differentials.length);
  const sorted = [...differentials].sort((a, b) => a - b).slice(0, used);
  const avg = sorted.reduce((sum, d) => sum + d, 0) / sorted.length;
  return Math.round(avg * 10) / 10;
}
