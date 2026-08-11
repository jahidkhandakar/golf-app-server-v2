import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { IndoorSession } from "./indoor.model";

const loadSession = async (sessionId: string) => {
  const session = await IndoorSession.findById(sessionId);
  if (!session) {
    throw new AppError(StatusCodes.NOT_FOUND, "Sim session not found");
  }
  return session;
};

const perBayCapacity = (s: {
  hoursPerSim: number;
  allowExtraPerSim: boolean;
}) => s.hoursPerSim + (s.allowExtraPerSim ? 1 : 0);

/**
 * Create a sim session — a league session or a one-time Sim Social Round (the
 * only indoor format open to invited non-league players). The sim board (bays)
 * replaces tee times; there is no email-to-course path (spec §13).
 */
export const createSession = async (userId: string, payload: any) => {
  return IndoorSession.create({
    league: payload.leagueId ?? null,
    title: payload.title,
    isSocialRound: Boolean(payload.isSocialRound),
    createdBy: userId,
    sims: payload.sims,
    hoursPerSim: payload.hoursPerSim,
    allowExtraPerSim: Boolean(payload.allowExtraPerSim),
    location:
      payload.coordinates != null
        ? { type: "Point", coordinates: payload.coordinates }
        : undefined,
    roster: payload.roster ?? [],
    bays: [],
  });
};

export const getSession = async (sessionId: string) =>
  IndoorSession.findById(sessionId)
    .populate("roster", "name image")
    .populate("bays.players", "name image");

/**
 * Creator assigns a player to a bay (spec §13 — no self-pairing, so only the
 * session creator arranges bays). Removes them from any other bay first; a
 * negative bayIndex returns them to the unassigned pool.
 */
export const assignBay = async (
  sessionId: string,
  userId: string,
  payload: { player: string; bayIndex: number },
) => {
  const session = await loadSession(sessionId);
  if (session.createdBy.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only the session creator can arrange bays (no self-pairing)",
    );
  }

  const { player, bayIndex } = payload;

  // Remove from all bays first.
  for (const bay of session.bays) {
    bay.players = bay.players.filter((p) => p.toString() !== player);
  }

  if (bayIndex >= 0 && bayIndex < session.sims) {
    let bay = session.bays.find((b) => b.bayIndex === bayIndex);
    if (!bay) {
      bay = { bayIndex, players: [] };
      session.bays.push(bay);
    }
    if (bay.players.length >= perBayCapacity(session)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "That bay is full");
    }
    bay.players.push(player as any);
  }

  if (!session.roster.some((r) => r.toString() === player)) {
    session.roster.push(player as any);
  }

  await session.save();
  return session;
};

/**
 * Record a proximity check result (spec §13). Only pass/fail + timestamp are
 * stored — never coordinates or movement history. The three kinds are session
 * check-in, one random mid-session check, and mutual confirmation at close.
 */
export const recordCheck = async (
  sessionId: string,
  userId: string,
  payload: { kind: "check-in" | "mid-session" | "close"; passed: boolean },
) => {
  const session = await loadSession(sessionId);
  session.checks.push({
    kind: payload.kind,
    player: userId as any,
    passed: payload.passed,
    at: new Date(),
  });
  await session.save();

  // Scoring opens only once at least two league members are checked in together.
  const checkedIn = new Set(
    session.checks
      .filter((c) => c.kind === "check-in" && c.passed)
      .map((c) => c.player.toString()),
  );
  return { recorded: true, scoringOpen: checkedIn.size >= 2 };
};

export const SimSessionService = {
  createSession,
  getSession,
  assignBay,
  recordCheck,
};
