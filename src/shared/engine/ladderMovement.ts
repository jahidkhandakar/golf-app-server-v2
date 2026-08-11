/**
 * Position-based ladder movement — the single source of truth for challenge
 * results, new-player entry, and decline penalties. Faithful server-side port
 * of the app's lib/features/top50/domain/ladder_movement.dart.
 *
 * Operates on opaque player ids with 1-based positions. Callers load the ranked
 * ladder, run these, and persist the returned positions.
 */

export interface LadderEntry {
  userId: string;
  position: number;
}

const renumber = (sorted: LadderEntry[]): LadderEntry[] =>
  sorted.map((e, i) => ({ userId: e.userId, position: i + 1 }));

/**
 * Apply a completed challenge. Call this when the round's scores are submitted,
 * not when the challenge is created (spec §11). The winner takes the loser's
 * exact position; the loser drops by min(5, distance) where distance is the gap
 * between the winner's prior rank and the loser's rank, floored at the bottom.
 * A player only moves up by beating someone ranked above them.
 */
export function applyChallengeResult(
  ladder: LadderEntry[],
  winnerId: string,
  loserId: string,
): LadderEntry[] {
  const sorted = [...ladder].sort((a, b) => a.position - b.position);
  const winnerIndex = sorted.findIndex((e) => e.userId === winnerId);
  const loserIndex = sorted.findIndex((e) => e.userId === loserId);

  // No move if either is missing or the loser was at/below the winner.
  if (winnerIndex < 0 || loserIndex < 0 || loserIndex >= winnerIndex) {
    return renumber(sorted);
  }

  const distance = winnerIndex - loserIndex; // ranks: (winnerIndex+1)-(loserIndex+1)
  const drop = distance < 5 ? distance : 5;

  // Step 1: winner takes the loser's slot; everyone between shifts down one.
  const [winner] = sorted.splice(winnerIndex, 1);
  sorted.splice(loserIndex, 0, winner);

  // Step 2: drop the loser (now at loserIndex+1) to loserIndex+drop, bounded.
  const loserCurrentIndex = loserIndex + 1;
  let loserTargetIndex = loserIndex + drop;
  if (loserTargetIndex > sorted.length - 1)
    loserTargetIndex = sorted.length - 1;
  if (loserTargetIndex > loserCurrentIndex) {
    const [loser] = sorted.splice(loserCurrentIndex, 1);
    sorted.splice(loserTargetIndex, 0, loser);
  }

  return renumber(sorted);
}

/**
 * Enter an unranked player after they beat a ranked player. Beating someone in
 * the top half enters at the midpoint; the bottom half enters at the 90% mark.
 * `maxSize` caps the list (50 for Top 50; null for the uncapped club ladder).
 */
export function enterNewPlayer(
  ladder: LadderEntry[],
  newPlayerId: string,
  beatenRank: number,
  maxSize?: number | null,
): LadderEntry[] {
  const sorted = [...ladder].sort((a, b) => a.position - b.position);
  const n = sorted.length;
  if (n === 0) return [{ userId: newPlayerId, position: 1 }];

  const midpoint = Math.ceil(n / 2);
  const entryRank =
    beatenRank <= midpoint
      ? midpoint
      : Math.min(Math.max(Math.round(n * 0.9), 1), n);

  const entryIndex = Math.min(Math.max(entryRank - 1, 0), n);
  sorted.splice(entryIndex, 0, { userId: newPlayerId, position: entryRank });

  if (maxSize != null && sorted.length > maxSize) sorted.pop();

  return renumber(sorted);
}

/**
 * Apply the decline penalty: the decliner drops `spots` positions (default 3),
 * floored at the bottom. Used when a co-registered player declines or ignores a
 * challenge.
 */
export function applyDeclinePenalty(
  ladder: LadderEntry[],
  declinerId: string,
  spots = 3,
): LadderEntry[] {
  const sorted = [...ladder].sort((a, b) => a.position - b.position);
  const index = sorted.findIndex((e) => e.userId === declinerId);
  if (index < 0) return renumber(sorted);

  let target = index + spots;
  if (target > sorted.length - 1) target = sorted.length - 1;
  if (target === index) return renumber(sorted);

  const [decliner] = sorted.splice(index, 1);
  sorted.splice(target, 0, decliner);

  return renumber(sorted);
}
