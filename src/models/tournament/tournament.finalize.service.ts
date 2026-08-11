import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Tournament } from "./tournament.model";
import { TournamentResult } from "../tournament-result/tournament.result.model";
import { KpEntry } from "../kp-live/kp.live.model";
import { User } from "../user/user.model";
import { assertTournamentStaff } from "../../shared/tournamentStaff";
import { notifyAndPush } from "../../notifications/notification.service";
import { scheduleAmountPurge } from "../../jobs/amount.purge.job";
import {
  computeSkins,
  EngineContestConfig,
  EnginePlayerScore,
} from "../../shared/engine/skins.engine";
import { rankTournament, RankablePlayer } from "../../shared/engine/rulings";

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
 * Finalize a tournament — the integration point that ties the deferred hooks
 * together (spec §1, §2, §7, §10):
 *   1. KP Live leaders become the official KP winners for any hole where no
 *      staff placard entry was made (staff entries always override).
 *   2. Skins are computed authoritatively and written as the official result
 *      (with amounts — the 24h purge strips them later).
 *   3. The tournament winner is decided by gross with the standard tiebreak.
 *   4. status → completed, finalResultsPushSent set, and every registered
 *      player gets the "Results are final" FCM push.
 *   5. The mandatory 24-hour money purge is armed.
 */
export const finalize = async (tournamentId: string, staffUserId: string) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  await assertTournamentStaff(tournament, staffUserId);

  if (tournament.status === "completed") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Tournament already finalized");
  }
  if (tournament.status === "cancelled") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A cancelled tournament cannot be finalized",
    );
  }

  let resultDoc = await TournamentResult.findOne({ tournament: tournamentId });
  if (!resultDoc) {
    resultDoc = await TournamentResult.create({ tournament: tournamentId });
  }

  const cfg = tournament.contestConfig as any;

  // 1. KP Live leaders → official winners where no staff placard entry exists.
  const staffKpHoles = new Set((resultDoc.kps ?? []).map((k: any) => k.hole));
  const kpLeaders = await KpEntry.find({
    tournament: tournamentId,
    isLeader: true,
    isLongDrive: false,
  });
  for (const leader of kpLeaders) {
    if (!staffKpHoles.has(leader.hole)) {
      resultDoc.kps.push({
        user: leader.player,
        hole: leader.hole,
        feet: leader.distance,
      } as any);
    }
  }

  // 2. Authoritative skins → official result (amounts retained until purge).
  let skinsCount = 0;
  if (cfg) {
    const scores: EnginePlayerScore[] = (resultDoc.playerScores ?? [])
      .filter((ps: any) => ps.user && Array.isArray(ps.holes))
      .map((ps: any) => ({ playerName: ps.user.toString(), holes: ps.holes }));

    const users = await User.find({
      _id: { $in: scores.map((s) => s.playerName) },
    }).select("clubHandicap");
    const handicaps: Record<string, number> = {};
    for (const u of users as any[]) {
      if (u.clubHandicap != null) handicaps[u._id.toString()] = u.clubHandicap;
    }

    const skins = computeSkins(scores, toEngineConfig(cfg), handicaps);
    resultDoc.skins = skins.map(
      (s) =>
        ({
          user: s.winner,
          hole: s.hole,
          score: String(s.winningScore),
          amount: s.value,
          isPaid: false,
        }) as any,
    );
    skinsCount = skins.length;
  }

  await resultDoc.save();

  // 3. Decide the winner by gross with the back-9/6/3/18th tiebreak.
  const rankable: RankablePlayer[] = (resultDoc.playerScores ?? [])
    .filter((ps: any) => ps.user)
    .map((ps: any) => ({
      player: ps.user.toString(),
      gross: ps.score ?? 0,
      holes: Array.isArray(ps.holes) ? ps.holes : [],
    }));
  const ranked = rankTournament(rankable);
  const winnerId = ranked.length > 0 ? ranked[0].player : null;

  // 4. Close the tournament and flag it for the push.
  tournament.status = "completed";
  tournament.finalResultsPushSent = true;
  tournament.isWinnerDeclared = true;
  await tournament.save();

  // Notify every registered player (in-app + FCM push).
  const name = tournament.tournamentName ?? tournament.courseName;
  await Promise.all(
    (tournament.tournamentPlayersList ?? []).map((playerId) =>
      notifyAndPush({
        sender: staffUserId,
        receiver: playerId.toString(),
        title: "Results are final",
        body: `Results are final for ${name}.`,
        type: "general",
        linkId: `/tournaments/${tournamentId}`,
        data: { tournamentId, event: "final-results" },
      }),
    ),
  );

  // 5. Arm the mandatory 24-hour money purge.
  const purge = await scheduleAmountPurge(tournamentId);

  return {
    finalized: true,
    winner: winnerId,
    skinsCount,
    kpOfficialised: kpLeaders.length,
    purgeScheduled: purge.scheduled,
  };
};

export const TournamentFinalizeService = { finalize };
