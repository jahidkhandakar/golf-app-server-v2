import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Tournament } from "../tournament/tournament.model";
import { User } from "../user/user.model";
import { TournamentResult } from "./tournament.result.model";
import { isClubStaff } from "../club-users/club.users.service";
import {
  computeSkins,
  computeContestValues,
  EngineContestConfig,
  EnginePlayerScore,
} from "../../shared/engine/skins.engine";
import { skinsCarried } from "../../shared/engine/rulings";
import { getCapForCountry } from "../country-cap/country.cap.service";

/** Staff gate for a tournament: its creator, or a creator/sub-admin of its
 *  club. Score entry and side-game management are staff-only. */
const assertTournamentStaff = async (
  tournament: any,
  userId: string,
): Promise<void> => {
  if (tournament.tournamentCreator?.toString() === userId) return;
  if (tournament.club && (await isClubStaff(tournament.club, userId))) return;
  throw new AppError(
    StatusCodes.FORBIDDEN,
    "Only the tournament creator or a club sub-admin can do this",
  );
};

/** Map the tournament's stored ContestConfig into the engine's config shape,
 *  converting player ObjectIds / guest docs into opaque string ids. */
const toEngineConfig = (cfg: any): EngineContestConfig => ({
  holePars: cfg.holePars ?? [],
  payoutMode: cfg.payoutMode ?? "poolSplit",
  skinsPot: cfg.skinsPot ?? 0,
  skinsDeductMidPercent: cfg.skinsDeductMidPercent ?? 0,
  skinsDeductPlusPercent: cfg.skinsDeductPlusPercent ?? 0,
  skinsOptOut: (cfg.skinsOptOut ?? []).map((id: any) => id.toString()),
  guests: (cfg.guests ?? []).map((g: any) => g.name),
  guestsInSideGames: cfg.guestsInSideGames ?? false,
});

/**
 * Staff enters (or corrects) a player's per-hole scores. Upserts into the
 * result doc's playerScores and keeps the gross total in sync. The skins engine
 * reads these to compute winners live.
 */
export const enterHoleScores = async (
  tournamentId: string,
  actingUserId: string,
  payload: { player: string; holes: number[]; teeBox?: string },
) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  await assertTournamentStaff(tournament, actingUserId);

  if (tournament.status === "completed") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Results are final; scores can no longer be edited",
    );
  }

  const { player, holes, teeBox } = payload;
  if (!Array.isArray(holes)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "holes must be an array");
  }
  const gross = holes.reduce((sum, h) => sum + (h > 0 ? h : 0), 0);

  let resultDoc = await TournamentResult.findOne({ tournament: tournamentId });
  if (!resultDoc) {
    resultDoc = await TournamentResult.create({ tournament: tournamentId });
  }

  const idx = resultDoc.playerScores.findIndex(
    (p: any) => p.user?.toString() === player,
  );
  if (idx > -1) {
    resultDoc.playerScores[idx].holes = holes;
    resultDoc.playerScores[idx].score = gross;
    if (teeBox !== undefined) resultDoc.playerScores[idx].teeBox = teeBox;
  } else {
    resultDoc.playerScores.push({
      user: player as any,
      holes,
      score: gross,
      teeBox,
    });
  }

  await resultDoc.save();
  return resultDoc;
};

/**
 * Authoritative live side-games for a tournament: skins computed from the
 * stored per-hole scores and the ContestConfig, plus KP pot values from the
 * recorded KP winners. Recomputed on demand so the board is always current.
 */
export const getLiveSideGames = async (tournamentId: string) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const cfg = tournament.contestConfig as any;
  if (!cfg) {
    return {
      skins: [],
      kpValues: [],
      showAmounts: tournament.showAmounts,
      configured: false,
    };
  }

  const resultDoc = await TournamentResult.findOne({
    tournament: tournamentId,
  });
  const playerScores = resultDoc?.playerScores ?? [];

  const scores: EnginePlayerScore[] = playerScores
    .filter((ps: any) => ps.user && Array.isArray(ps.holes))
    .map((ps: any) => ({ playerName: ps.user.toString(), holes: ps.holes }));

  // Handicaps for the deduction bands. A visitor with fewer than 3 rounds at
  // the club has no established handicap (clubHandicap is null), so we omit them
  // here — the engine then applies no deduction band to them (spec §10 visitor
  // rule).
  const users = await User.find({
    _id: { $in: scores.map((s) => s.playerName) },
  }).select("clubHandicap");
  const handicaps: Record<string, number> = {};
  for (const u of users as any[]) {
    if (u.clubHandicap !== undefined && u.clubHandicap !== null) {
      handicaps[u._id.toString()] = u.clubHandicap;
    }
  }

  const skins = computeSkins(scores, toEngineConfig(cfg), handicaps);

  // KP pot values from recorded KP winners (holes with an entry).
  const kpWonHoles = new Set<number>(
    (resultDoc?.kps ?? [])
      .map((k: any) => k.hole)
      .filter((h: any): h is number => typeof h === "number"),
  );
  const kpValuesMap = computeContestValues({
    eligibleHoles: cfg.kpHoles ?? [],
    wonHoles: kpWonHoles,
    pot: cfg.kpPot ?? 0,
    mode: cfg.payoutMode ?? "poolSplit",
  });
  let kpValues = [...kpValuesMap.entries()].map(([hole, value]) => ({
    hole,
    value,
  }));

  // ── Money compliance (spec §2) ──────────────────────────────────────────
  const totalPayout =
    (cfg.skinsPot ?? 0) + (cfg.kpPot ?? 0) + (cfg.longDrivePot ?? 0);
  const cap = await getCapForCountry(tournament.country);
  const overCap = totalPayout > cap.capAmount;
  // Amounts show only when the toggle is on AND the payout is within the cap;
  // over the cap they are hidden entirely regardless of the toggle.
  const amountsVisible = Boolean(tournament.showAmounts) && !overCap;

  let skinsResults = skins;
  let skinsPotCarried: number | null = skinsCarried(
    cfg.skinsPot ?? 0,
    skins.length,
  );

  if (!amountsVisible) {
    // Names, holes and win status survive; dollar figures are withheld.
    skinsResults = skins.map((s) => ({ ...s, value: 0 }));
    kpValues = kpValues.map((k) => ({ ...k, value: 0 }));
    skinsPotCarried = null;
  }

  const compliance = {
    // "net" format with a cash skins pot → amateur-status warning.
    netScoringCashWarning:
      cfg.scoringFormat === "net" && (cfg.skinsPot ?? 0) > 0,
    // Handicap-based deductions in play → disclosure note.
    deductionDisclosure:
      (cfg.skinsDeductMidPercent ?? 0) > 0 ||
      (cfg.skinsDeductPlusPercent ?? 0) > 0,
    cap,
    totalPayout,
    overCap,
  };

  return {
    skins: skinsResults,
    kpValues,
    skinsPotCarried,
    showAmounts: tournament.showAmounts,
    amountsVisible,
    compliance,
    configured: true,
  };
};

export const SideGamesService = {
  enterHoleScores,
  getLiveSideGames,
};
