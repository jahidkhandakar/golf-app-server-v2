import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { ClubUser } from "./club.users.model";
import { User } from "../user/user.model";
import {
  canChallenge,
  ChallengeCheck,
} from "../../shared/engine/clubLadderRules";
import { applyChallengeResult as computeLadderMove } from "../../shared/engine/ladderMovement";

/**
 * Club leaderboard ladder (spec §9). Positions are seeded from handicap order
 * at opt-in and then moved only by challenges — never re-sorted by handicap.
 * "Ranked" means an accepted member who has opted in AND has an established
 * club handicap (non-null; established at 3+ rounds).
 */

interface RankedMember {
  userId: string;
  position: number;
  clubHandicap: number;
}

/** Ranked members of a club, sorted by stored ladder position. */
export const getRankedMembers = async (
  clubId: string | Types.ObjectId,
): Promise<RankedMember[]> => {
  const rows = await ClubUser.find({
    club: clubId,
    status: "accepted",
    leaderboardOptedIn: true,
    leaderboardPosition: { $ne: null },
  }).populate("user", "clubHandicap");

  return rows
    .filter((r: any) => r.user && r.user.clubHandicap != null)
    .map((r: any) => ({
      userId: r.user._id.toString(),
      position: r.leaderboardPosition as number,
      clubHandicap: r.user.clubHandicap as number,
    }))
    .sort((a, b) => a.position - b.position);
};

export const rankedCount = async (
  clubId: string | Types.ObjectId,
): Promise<number> => {
  return (await getRankedMembers(clubId)).length;
};

/**
 * Opt a member into the leaderboard. Requires an established handicap. Seeds the
 * position from handicap order (one below every ranked member with a better
 * handicap) and shifts everyone at or below that slot down by one so positions
 * stay contiguous.
 */
export const optIn = async (
  clubId: string | Types.ObjectId,
  userId: string,
) => {
  const membership = await ClubUser.findOne({
    club: clubId,
    user: userId,
    status: "accepted",
  });
  if (!membership) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "You are not an accepted member of this club",
    );
  }
  if (membership.leaderboardOptedIn) return membership;

  const user = await User.findById(userId).select("clubHandicap");
  if (!user || user.clubHandicap == null) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "An established handicap (3+ rounds) is required to join the leaderboard",
    );
  }

  const ranked = await getRankedMembers(clubId);
  const betterThanUser = ranked.filter(
    (m) => m.clubHandicap < (user.clubHandicap as number),
  ).length;
  const seededPosition = betterThanUser + 1;

  // Make room: shift everyone at or below the seeded slot down by one.
  await ClubUser.updateMany(
    {
      club: clubId,
      leaderboardOptedIn: true,
      leaderboardPosition: { $gte: seededPosition },
    },
    { $inc: { leaderboardPosition: 1 } },
  );

  membership.leaderboardOptedIn = true;
  membership.leaderboardPosition = seededPosition;
  await membership.save();
  return membership;
};

/** Opt a member out. Closes the gap by shifting those below up by one. */
export const optOut = async (
  clubId: string | Types.ObjectId,
  userId: string,
) => {
  const membership = await ClubUser.findOne({
    club: clubId,
    user: userId,
  });
  if (!membership || !membership.leaderboardOptedIn) return membership;

  const vacated = membership.leaderboardPosition;
  membership.leaderboardOptedIn = false;
  membership.leaderboardPosition = null;
  await membership.save();

  if (vacated != null) {
    await ClubUser.updateMany(
      {
        club: clubId,
        leaderboardOptedIn: true,
        leaderboardPosition: { $gt: vacated },
      },
      { $inc: { leaderboardPosition: -1 } },
    );
  }
  return membership;
};

/**
 * Validate a proposed challenge against the club's scaling rules (spec §9). The
 * positional range applies only to a *ladder* challenge — one between two ranked
 * members. If either player isn't ranked this isn't a ladder challenge, so it
 * passes through (ordinary tournament group challenges are unaffected).
 */
export const validateChallenge = async (
  clubId: string | Types.ObjectId,
  challengerId: string,
  challengedId: string,
): Promise<ChallengeCheck> => {
  const ranked = await getRankedMembers(clubId);
  const challenger = ranked.find((m) => m.userId === challengerId);
  const challenged = ranked.find((m) => m.userId === challengedId);
  if (!challenger || !challenged) {
    return { allowed: true };
  }
  return canChallenge(challenger.position, challenged.position, ranked.length);
};

/**
 * Move the club ladder after a decisive challenge (spec §9/§11): winner takes
 * the loser's slot, loser drops min(5, distance). Persists only the positions
 * that actually changed. No-op when either player isn't ranked.
 */
export const applyChallengeResult = async (
  clubId: string | Types.ObjectId,
  winnerId: string,
  loserId: string,
) => {
  const ranked = await getRankedMembers(clubId);
  const before = ranked.map((m) => ({
    userId: m.userId,
    position: m.position,
  }));
  if (
    !before.some((e) => e.userId === winnerId) ||
    !before.some((e) => e.userId === loserId)
  ) {
    return; // not a ranked ladder challenge
  }

  const after = computeLadderMove(before, winnerId, loserId);
  const ops = after
    .filter((a) => {
      const b = before.find((x) => x.userId === a.userId);
      return b && b.position !== a.position;
    })
    .map((a) => ({
      updateOne: {
        filter: { club: clubId, user: a.userId },
        update: { $set: { leaderboardPosition: a.position } },
      },
    }));

  if (ops.length) await ClubUser.bulkWrite(ops);
};

export const ClubLadderService = {
  getRankedMembers,
  rankedCount,
  optIn,
  optOut,
  validateChallenge,
  applyChallengeResult,
};
