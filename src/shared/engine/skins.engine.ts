/**
 * Skins / side-game scoring engine — the authoritative server-side port of the
 * app's Dart engine (lib/features/tournament/domain/skins.dart). Pure and
 * dependency-free so it is trivially testable and reusable at live-compute and
 * at finalize.
 *
 * Players are identified by an opaque string (a User id or, for guests, their
 * name). The caller maps its ObjectIds/guests to those strings.
 *
 * A hole is won when exactly one player holds the best score and that score is
 * birdie or better. A lone par takes an otherwise-open hole (nobody at birdie+,
 * exactly one par in the field). Everything else leaves the hole open.
 */

export type PayoutMode = "poolSplit" | "carryover";

export interface EnginePlayerScore {
  /** Opaque player identifier (User id or guest name). */
  playerName: string;
  /** Per-hole strokes, index 0 = hole 1. 0 means "not entered". */
  holes?: number[];
}

export interface EngineContestConfig {
  /** Par for holes 1..18 in order. */
  holePars: number[];
  payoutMode: PayoutMode;
  skinsPot: number;
  skinsDeductMidPercent: number;
  skinsDeductPlusPercent: number;
  /** Player ids excluded from skins (spec §4). */
  skinsOptOut: string[];
  /** Guest ids; excluded unless guestsInSideGames is on (spec §5). */
  guests: string[];
  guestsInSideGames: boolean;
}

export interface SkinResult {
  hole: number;
  winner: string;
  winningScore: number;
  par: number;
  /** True when the skin was taken by a lone par rather than a birdie or better. */
  wonWithPar: boolean;
  /** Dollar value under the payout mode, after handicap deduction/redistribution. */
  value: number;
  /** Deduction percent applied to this winner, 0 when none. */
  deductPercent: number;
}

const parForHole = (holePars: number[], hole: number): number =>
  hole >= 1 && hole <= holePars.length ? holePars[hole - 1] : 4;

/**
 * Compute tournament-wide skins. Deduction bands (spec, ported from the app):
 * winners with a club handicap >= 5.6 keep their full skin; 0..5.5 give up the
 * mid band, plus-handicaps (< 0) give up the plus band. Everything deducted is
 * redistributed evenly across the skins held by winners at 5.6+. If nobody sits
 * at 5.6+ there is no recipient, so the deduction is undone.
 */
export function computeSkins(
  allScores: EnginePlayerScore[],
  config: EngineContestConfig,
  handicaps: Record<string, number> = {},
): SkinResult[] {
  const midPct = config.skinsDeductMidPercent ?? 0;
  const plusPct = config.skinsDeductPlusPercent ?? 0;

  const skinsOptOut = new Set(config.skinsOptOut ?? []);
  const guests = new Set(config.guests ?? []);
  const participates = (p: string): boolean =>
    !skinsOptOut.has(p) && (config.guestsInSideGames || !guests.has(p));

  const winners = new Map<
    number,
    { player: string; score: number; par: boolean }
  >();

  for (let hole = 1; hole <= 18; hole++) {
    const par = parForHole(config.holePars, hole);
    const entries: { player: string; score: number }[] = [];
    for (const s of allScores) {
      // Opted-out players and excluded guests are invisible: they can neither
      // win nor cut a hole.
      if (!participates(s.playerName)) continue;
      const holes = s.holes;
      if (!holes || holes.length < hole) continue;
      const v = holes[hole - 1];
      if (v > 0) entries.push({ player: s.playerName, score: v });
    }
    if (entries.length === 0) continue;

    const best = entries.reduce((a, b) => (a.score < b.score ? a : b)).score;
    const holders = entries.filter((e) => e.score === best);

    if (best <= par - 1 && holders.length === 1) {
      winners.set(hole, { player: holders[0].player, score: best, par: false });
      continue;
    }
    // Lone par takes an open hole.
    if (best === par) {
      const pars = entries.filter((e) => e.score === par);
      if (pars.length === 1) {
        winners.set(hole, { player: pars[0].player, score: par, par: true });
      }
    }
  }

  if (winners.size === 0) return [];

  const values = new Map<number, number>();
  if (config.payoutMode === "poolSplit") {
    const each = config.skinsPot / winners.size;
    for (const h of winners.keys()) values.set(h, each);
  } else {
    const nominal = config.skinsPot / 18;
    let carried = 0;
    for (let hole = 1; hole <= 18; hole++) {
      if (winners.has(hole)) {
        values.set(hole, nominal + carried);
        carried = 0;
      } else {
        carried += nominal;
      }
    }
    if (carried > 0 && winners.size > 0) {
      const extra = carried / winners.size;
      for (const h of winners.keys()) {
        values.set(h, (values.get(h) ?? 0) + extra);
      }
    }
  }

  // Handicap band deduction + redistribution.
  const deducts = new Map<number, number>();
  if (midPct > 0 || plusPct > 0) {
    let pool = 0;
    const eligibleHoles: number[] = [];
    for (const [hole, w] of winners.entries()) {
      const hcp = handicaps[w.player];
      if (hcp === undefined || hcp >= 5.6) {
        eligibleHoles.push(hole);
        continue;
      }
      const pct = hcp < 0 ? plusPct : midPct;
      if (pct <= 0) {
        eligibleHoles.push(hole);
        continue;
      }
      deducts.set(hole, pct);
      const v = values.get(hole) ?? 0;
      const taken = (v * pct) / 100;
      pool += taken;
      values.set(hole, v - taken);
    }
    if (eligibleHoles.length === 0) {
      // Nobody at 5.6+ to receive the pool: undo the deduction.
      for (const [hole, pct] of deducts.entries()) {
        const v = values.get(hole) ?? 0;
        values.set(hole, v / (1 - pct / 100));
      }
      deducts.clear();
    } else if (pool > 0) {
      const share = pool / eligibleHoles.length;
      for (const h of eligibleHoles) {
        values.set(h, (values.get(h) ?? 0) + share);
      }
    }
  }

  const results: SkinResult[] = [];
  for (const [hole, w] of winners.entries()) {
    results.push({
      hole,
      winner: w.player,
      winningScore: w.score,
      par: parForHole(config.holePars, hole),
      wonWithPar: w.par,
      value: values.get(hole) ?? 0,
      deductPercent: deducts.get(hole) ?? 0,
    });
  }
  results.sort((a, b) => a.hole - b.hole);
  return results;
}

/**
 * Per-winner KP / long-drive payouts under the payout mode. `eligibleHoles` is
 * the designated hole list in course order; `wonHoles` are the holes with a
 * recorded winner. Returns hole -> dollar value for won holes. Ported from the
 * app's Skins.contestValues. (spec §1b, §10 pot division)
 */
export function computeContestValues(params: {
  eligibleHoles: number[];
  wonHoles: Set<number>;
  pot: number;
  mode: PayoutMode;
}): Map<number, number> {
  const { eligibleHoles, wonHoles, pot, mode } = params;
  const won = eligibleHoles.filter((h) => wonHoles.has(h));
  const values = new Map<number, number>();
  if (won.length === 0 || pot <= 0) return values;

  if (mode === "poolSplit") {
    const each = pot / won.length;
    for (const h of won) values.set(h, each);
  } else {
    const nominal = pot / eligibleHoles.length;
    let carried = 0;
    for (const h of eligibleHoles) {
      if (wonHoles.has(h)) {
        values.set(h, nominal + carried);
        carried = 0;
      } else {
        carried += nominal;
      }
    }
    if (carried > 0) {
      const extra = carried / won.length;
      for (const h of won) values.set(h, (values.get(h) ?? 0) + extra);
    }
  }
  return values;
}
