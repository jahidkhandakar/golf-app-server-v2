/**
 * Club leaderboard size-scaled rules (spec §9), the server-side mirror of the
 * app's _ClubLadderRules. All derive from the number of *ranked* members —
 * those opted in with an established handicap (3+ rounds).
 */
export class ClubLadderRules {
  constructor(public readonly rankedCount: number) {}

  /** Challenge range: 30% of ranked members, floor 3, ceiling 15. */
  get challengeRange(): number {
    return clamp(Math.round(this.rankedCount * 0.3), 3, 15);
  }

  /** Top-10 gate activates at 25+ ranked members. */
  get top10GateActive(): boolean {
    return this.rankedCount >= 25;
  }

  /** Bottom-5 unranked group appears at 15+ ranked members. */
  get showBottom5(): boolean {
    return this.rankedCount >= 15;
  }

  /** Leaderboard + challenges go live at 8 ranked members. */
  get isActive(): boolean {
    return this.rankedCount >= 8;
  }

  /** Entry position for a new player who beats someone in the top half. */
  get entryTopHalf(): number {
    return Math.ceil(this.rankedCount / 2);
  }

  /** Entry position for a new player who beats someone in the bottom half. */
  get entryBottomHalf(): number {
    return clamp(Math.round(this.rankedCount * 0.9), 1, this.rankedCount);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface ChallengeCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a proposed challenge between two ladder positions (spec §9):
 * - the ladder must be active (>= 8 ranked members);
 * - the positional gap must be within the challenge range (30%, floor 3,
 *   ceiling 15).
 *
 * NOTE: the top-10 gate (rankedCount >= 25) is surfaced via ClubLadderRules
 * .top10GateActive but its exact restriction is not specified in §9 alone;
 * wire the precise rule once confirmed. Range + activation are enforced here.
 */
export function canChallenge(
  challengerPosition: number,
  challengedPosition: number,
  rankedCount: number,
): ChallengeCheck {
  const rules = new ClubLadderRules(rankedCount);
  if (!rules.isActive) {
    return {
      allowed: false,
      reason: `The club leaderboard is not active yet (needs 8 ranked members, has ${rankedCount}).`,
    };
  }
  const gap = Math.abs(challengerPosition - challengedPosition);
  if (gap === 0) {
    return { allowed: false, reason: "You cannot challenge yourself." };
  }
  if (gap > rules.challengeRange) {
    return {
      allowed: false,
      reason: `That player is outside your challenge range of ${rules.challengeRange} positions.`,
    };
  }
  return { allowed: true };
}
