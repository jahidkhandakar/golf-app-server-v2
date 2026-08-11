import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { IndoorLeague, IndoorLeagueMember, IndoorRound } from "./indoor.model";
import { differential, indoorHandicapIndex } from "./indoor.handicap";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ENTRY_WINDOW_MS = 3 * WEEK_MS;
const WEEKLY_BANK_CEILING = 3;

const loadLeague = async (leagueId: string) => {
  const league = await IndoorLeague.findById(leagueId);
  if (!league) {
    throw new AppError(StatusCodes.NOT_FOUND, "Indoor league not found");
  }
  return league;
};

const assertCreator = (league: { createdBy: unknown }, userId: string) => {
  if (league.createdBy?.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the league creator can do this",
    );
  }
};

/** Capacity: sims × hours, plus sims when the extra toggle is on (spec §13). */
const capacity = (l: {
  sims: number;
  hoursPerSim: number;
  allowExtraPerSim: boolean;
}) => l.sims * l.hoursPerSim + (l.allowExtraPerSim ? l.sims : 0);

export const createLeague = async (userId: string, payload: any) => {
  const league = await IndoorLeague.create({
    name: payload.name,
    facilityName: payload.facilityName,
    facilityTimezone: payload.facilityTimezone ?? "UTC",
    createdBy: userId,
    sims: payload.sims,
    hoursPerSim: payload.hoursPerSim,
    allowExtraPerSim: Boolean(payload.allowExtraPerSim),
    entryFeeNote: payload.entryFeeNote ?? "",
    totalRounds: payload.totalRounds ?? 10,
    startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
    midSeasonPrizes: Boolean(payload.midSeasonPrizes),
  });
  return league;
};

export const listLeagues = async () =>
  IndoorLeague.find().sort({ createdAt: -1 });

export const getLeague = async (leagueId: string) => {
  const league = await loadLeague(leagueId);
  const members = await IndoorLeagueMember.find({ league: leagueId })
    .populate("player", "name image")
    .sort({ flight: 1, flightOrder: 1 });
  return {
    league,
    capacity: capacity(league),
    entryOpen: Date.now() <= league.startDate.getTime() + ENTRY_WINDOW_MS,
    members,
  };
};

/**
 * Submit a league round (spec §13). Credits to the player's next unfilled week.
 * New entrants are refused once entry closes (3 weeks after start). Banking
 * ahead is capped at 3 rounds per real calendar week; makeups (weeks at or
 * before the current calendar week) are unlimited, bounded by total_rounds. The
 * indoor handicap is recomputed after each round.
 */
export const submitRound = async (
  leagueId: string,
  playerId: string,
  payload: {
    gross: number;
    courseRating: number;
    slopeRating: number;
    witnessPlayer?: string;
  },
) => {
  const league = await loadLeague(leagueId);
  const now = Date.now();
  const start = league.startDate.getTime();

  let member = await IndoorLeagueMember.findOne({
    league: leagueId,
    player: playerId,
  });

  // Entry closes 3 weeks after start for NEW entrants (existing keep playing).
  if (!member && now > start + ENTRY_WINDOW_MS) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "League entry has closed (3 weeks after start)",
    );
  }
  if (!member) {
    member = await IndoorLeagueMember.create({
      league: leagueId,
      player: playerId,
    });
  }

  // Next unfilled week on the player's card.
  const rounds = await IndoorRound.find({ league: leagueId, player: playerId });
  const filled = new Set(rounds.map((r) => r.weekNumber));
  let nextWeek = 1;
  while (filled.has(nextWeek) && nextWeek <= league.totalRounds) nextWeek++;
  if (nextWeek > league.totalRounds) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Your league card is already complete",
    );
  }

  // Calendar week since start (1-based). Banking ahead = filling a week beyond it.
  const currentCalendarWeek = Math.floor((now - start) / WEEK_MS) + 1;
  if (nextWeek > currentCalendarWeek) {
    const weekStart = start + (currentCalendarWeek - 1) * WEEK_MS;
    const submittedThisWeek = rounds.filter(
      (r) => r.submittedAt.getTime() >= weekStart,
    ).length;
    if (submittedThisWeek >= WEEKLY_BANK_CEILING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "You can bank at most 3 rounds ahead in a single week",
      );
    }
  }

  const round = await IndoorRound.create({
    league: leagueId,
    player: playerId,
    weekNumber: nextWeek,
    gross: payload.gross,
    courseRating: payload.courseRating,
    slopeRating: payload.slopeRating,
    witnessPlayer: payload.witnessPlayer ?? null,
    witnessStatus: "pending",
  });

  // Recompute indoor handicap from all differentials.
  const allRounds = [...rounds, round];
  const diffs = allRounds.map((r) =>
    differential(r.gross, r.courseRating, r.slopeRating),
  );
  member.roundsPlayed = allRounds.length;
  member.indoorHandicap = indoorHandicapIndex(diffs);
  await member.save();

  return { round, weekNumber: nextWeek, established: allRounds.length >= 3 };
};

/** Witness verification result (spec §13): pass → verified, fail → failed. Only
 *  the outcome is recorded; proximity coordinates are never stored. */
export const verifyWitness = async (roundId: string, passed: boolean) => {
  const round = await IndoorRound.findById(roundId);
  if (!round) throw new AppError(StatusCodes.NOT_FOUND, "Round not found");
  round.witnessStatus = passed ? "verified" : "failed";
  await round.save();
  return round;
};

/** Creator override for genuine witness failures (e.g. a dead phone). */
export const creatorOverride = async (
  leagueId: string,
  roundId: string,
  userId: string,
) => {
  const league = await loadLeague(leagueId);
  assertCreator(league, userId);
  const round = await IndoorRound.findOne({ _id: roundId, league: leagueId });
  if (!round) throw new AppError(StatusCodes.NOT_FOUND, "Round not found");
  round.witnessStatus = "overridden";
  await round.save();
  return round;
};

/** A round is skins-eligible only when witnessed (verified or overridden). */
export const isSkinsEligible = (status: string) =>
  status === "verified" || status === "overridden";

/** Creator allocates flights and sets flight order for established members. */
export const setFlights = async (
  leagueId: string,
  userId: string,
  allocations: { player: string; flight: number; flightOrder: number }[],
) => {
  const league = await loadLeague(leagueId);
  assertCreator(league, userId);
  await Promise.all(
    allocations.map((a) =>
      IndoorLeagueMember.updateOne(
        { league: leagueId, player: a.player },
        { $set: { flight: a.flight, flightOrder: a.flightOrder } },
      ),
    ),
  );
  return getLeague(leagueId);
};

/**
 * Season standings: per flight, each week the lowest gross earns the most
 * points (spec §13 "weekly points, lowest score wins per flight"). Returns
 * flights with members ranked by total points; season prizes pay a net and a
 * gross winner per flight.
 */
export const getStandings = async (leagueId: string) => {
  const league = await loadLeague(leagueId);
  const members = await IndoorLeagueMember.find({ league: leagueId }).populate(
    "player",
    "name image",
  );
  const rounds = await IndoorRound.find({ league: leagueId });

  // group members by flight
  const flights = new Map<number, any[]>();
  for (const m of members) {
    const f = m.flight ?? 0;
    if (!flights.has(f)) flights.set(f, []);
    flights.get(f)!.push(m);
  }

  const points: Record<string, number> = {};
  for (let week = 1; week <= league.totalRounds; week++) {
    for (const [, flightMembers] of flights) {
      const ids = new Set(flightMembers.map((m) => m.player._id.toString()));
      const weekRounds = rounds
        .filter((r) => r.weekNumber === week && ids.has(r.player.toString()))
        .sort((a, b) => a.gross - b.gross);
      // Lowest gross earns the most points (size, size-1, ...).
      weekRounds.forEach((r, i) => {
        const pid = r.player.toString();
        points[pid] = (points[pid] ?? 0) + Math.max(weekRounds.length - i, 0);
      });
    }
  }

  const result = [...flights.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([flight, flightMembers]) => ({
      flight,
      standings: flightMembers
        .map((m) => ({
          player: m.player,
          indoorHandicap: m.indoorHandicap,
          points: points[m.player._id.toString()] ?? 0,
        }))
        .sort((a, b) => b.points - a.points),
    }));

  return result;
};

export const IndoorService = {
  createLeague,
  listLeagues,
  getLeague,
  submitRound,
  verifyWitness,
  creatorOverride,
  isSkinsEligible,
  setFlights,
  getStandings,
};
