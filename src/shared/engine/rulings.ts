/**
 * Sealed competition rulings enforced server-side (spec §10). Pure and
 * dependency-free so they can be unit-tested and reused at finalize.
 */

/** Sum a player's strokes over holes [from..to] (1-based, inclusive).
 *  Unentered holes (0) contribute nothing. */
export function sumHoles(holes: number[], from: number, to: number): number {
  let total = 0;
  for (let h = from; h <= to; h++) {
    const v = holes[h - 1];
    if (typeof v === "number" && v > 0) total += v;
  }
  return total;
}

/**
 * Tournament tiebreak between two complete cards: back 9, then back 6, then
 * back 3, then the 18th hole. Returns a comparator value — negative when `a`
 * ranks ahead (fewer strokes over the first differing segment), positive when
 * `b` does, 0 when still tied after the 18th. (spec §10)
 *
 * The creator may override with their own method at Final; this is the default.
 */
export function breakTournamentTie(a: number[], b: number[]): number {
  const segments: [number, number][] = [
    [10, 18], // back 9
    [13, 18], // back 6
    [16, 18], // back 3
    [18, 18], // 18th
  ];
  for (const [from, to] of segments) {
    const diff = sumHoles(a, from, to) - sumHoles(b, from, to);
    if (diff !== 0) return diff;
  }
  return 0;
}

export interface RankablePlayer {
  player: string;
  gross: number;
  holes: number[];
}

/**
 * Rank players by gross (lowest first), breaking exact ties with the standard
 * back-9/6/3/18th cascade. Stable for players that remain tied.
 */
export function rankTournament(players: RankablePlayer[]): RankablePlayer[] {
  return [...players].sort((a, b) => {
    if (a.gross !== b.gross) return a.gross - b.gross;
    return breakTournamentTie(a.holes, b.holes);
  });
}

export type ChallengeOutcome = "p1" | "p2" | "push";

/**
 * Resolve a challenge by gross score: lower gross wins; an exact tie is a push
 * (no movement, no penalty either way — spec §10). The ladder-movement side of
 * this is enforced in Phase 3 (§9); this fixes only the ruling.
 */
export function resolveChallengeByScore(
  p1Gross: number,
  p2Gross: number,
): ChallengeOutcome {
  if (p1Gross === p2Gross) return "push";
  return p1Gross < p2Gross ? "p1" : "p2";
}

/**
 * Skins pot carry: when no skin is won the whole pot carries and nothing is
 * distributed (spec §10). Returns the carried amount (0 when there were
 * winners).
 */
export function skinsCarried(pot: number, winnerCount: number): number {
  return winnerCount === 0 ? pot : 0;
}
