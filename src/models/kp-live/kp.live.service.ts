import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { Tournament } from "../tournament/tournament.model";
import { KpPin, KpEntry } from "./kp.live.model";
import { ContestCategory } from "./kp.live.interface";
import { isClubStaff } from "../club-users/club.users.service";
import { deleteFromS3 } from "../../middlewares/fileUploadHandler";

/** Tournament staff gate: creator or a club creator/sub-admin. */
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

const loadTournament = async (tournamentId: string) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  return tournament;
};

/** A KP entry is "better" than the current leader when it is strictly closer
 *  (KP, lower feet) or strictly longer (long drive, higher yards). Matching the
 *  leader is not better — first recorded stands (spec §1 strict-beat). */
const beats = (candidate: number, leader: number, isLongDrive: boolean) =>
  isLongDrive ? candidate > leader : candidate < leader;

/**
 * Drop the pin for a KP hole. The first group to reach it pins it; later groups
 * read the pin to drive the 40-yard geofence popup client-side. One pin per
 * hole — a second attempt is rejected so the original location stands.
 */
export const pinHole = async (
  tournamentId: string,
  userId: string,
  payload: { hole: number; coordinates: [number, number] },
) => {
  const tournament = await loadTournament(tournamentId);
  const cfg = tournament.contestConfig as any;

  if (!cfg?.kpLiveEnabled) {
    throw new AppError(StatusCodes.BAD_REQUEST, "KP Live is not enabled");
  }
  if (!(cfg.kpHoles ?? []).includes(payload.hole)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "That hole is not a KP hole for this tournament",
    );
  }

  const existing = await KpPin.findOne({
    tournament: tournamentId,
    hole: payload.hole,
  });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This hole is already pinned by the first group",
    );
  }

  return KpPin.create({
    tournament: tournamentId,
    hole: payload.hole,
    location: { type: "Point", coordinates: payload.coordinates },
    pinnedBy: userId,
  });
};

/** All pins for a tournament (so the client can arm the geofence popups). */
export const getPins = async (tournamentId: string) => {
  return KpPin.find({ tournament: tournamentId });
};

/**
 * Record a KP / long-drive entry captured on course. The acting user is the
 * measurer. Enforces: results not final, hole is a KP/long-drive hole,
 * measurer != player, player not opted out of KPs, two photos present, and the
 * strict-beat rule. When it beats the current leader, the old leader is
 * dethroned and its photos are deleted from S3 (its distance stays). (spec §1)
 */
export const submitEntry = async (
  tournamentId: string,
  measurerId: string,
  payload: {
    hole: number;
    category?: ContestCategory;
    isLongDrive?: boolean;
    player: string;
    distance: number;
    photos: string[];
  },
) => {
  const tournament = await loadTournament(tournamentId);
  const cfg = tournament.contestConfig as any;

  if (tournament.status === "completed") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Results are final; entries are closed",
    );
  }
  if (!cfg) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This tournament has no side-game configuration",
    );
  }

  const isLongDrive = Boolean(payload.isLongDrive);
  const category: ContestCategory = payload.category ?? "open";
  const holeList: number[] = isLongDrive
    ? (cfg.longDriveHoles ?? [])
    : (cfg.kpHoles ?? []);

  if (!isLongDrive && !cfg.kpLiveEnabled) {
    throw new AppError(StatusCodes.BAD_REQUEST, "KP Live is not enabled");
  }
  if (!holeList.includes(payload.hole)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `That hole is not a ${isLongDrive ? "long drive" : "KP"} hole`,
    );
  }
  if (measurerId === payload.player) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "The measurer cannot be the player",
    );
  }

  // A kpOptOut player may measure for a teammate but cannot win (spec §4).
  const kpOptOut: string[] = (cfg.kpOptOut ?? []).map((id: any) =>
    id.toString(),
  );
  if (kpOptOut.includes(payload.player)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "That player has opted out of KPs and cannot win",
    );
  }

  if (!Array.isArray(payload.photos) || payload.photos.length !== 2) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Two AR-captured photos are required",
    );
  }

  const filter = {
    tournament: tournamentId,
    hole: payload.hole,
    category,
    isLongDrive,
  };

  const leader = await KpEntry.findOne({ ...filter, isLeader: true });
  if (leader) {
    if (!beats(payload.distance, leader.distance, isLongDrive)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        isLongDrive
          ? "Entry must be strictly longer than the current leader"
          : "Entry must be strictly closer than the current leader",
      );
    }
    // Dethrone the old leader: keep its distance, purge its photos from S3.
    const oldPhotos = leader.photos ?? [];
    leader.isLeader = false;
    leader.dethronedAt = new Date();
    leader.photos = [];
    await leader.save();
    if (oldPhotos.length) await deleteFromS3(oldPhotos);
  }

  return KpEntry.create({
    tournament: tournamentId,
    hole: payload.hole,
    category,
    isLongDrive,
    player: payload.player,
    measurer: measurerId,
    distance: payload.distance,
    photos: payload.photos,
    isLeader: true,
  });
};

/**
 * The ordered board for a hole+category: leader first, then every dethroned
 * distance behind it. KP ascending (closest first), long drive descending.
 */
export const getBoard = async (
  tournamentId: string,
  hole: number,
  category: ContestCategory,
  isLongDrive: boolean,
) => {
  const entries = await KpEntry.find({
    tournament: tournamentId,
    hole,
    category,
    isLongDrive,
  })
    .populate("player", "name email image")
    .populate("measurer", "name email image");

  entries.sort((a, b) =>
    isLongDrive ? b.distance - a.distance : a.distance - b.distance,
  );
  return entries;
};

/** Every current leader across all holes/categories — the KP Live winners that
 *  become official at Final unless a staff placard entry overrides them. */
export const getCurrentLeaders = async (tournamentId: string) => {
  return KpEntry.find({ tournament: tournamentId, isLeader: true })
    .populate("player", "name email image")
    .populate("measurer", "name email image");
};

/**
 * Staff removal of a disputed entry (e.g. a ball that was not on the green).
 * Purges its photos. If the removed entry was the leader, the next-best
 * remaining entry is promoted to leader.
 */
export const deleteEntry = async (
  tournamentId: string,
  entryId: string,
  userId: string,
) => {
  const tournament = await loadTournament(tournamentId);
  await assertTournamentStaff(tournament, userId);

  const entry = await KpEntry.findOne({
    _id: entryId,
    tournament: tournamentId,
  });
  if (!entry) {
    throw new AppError(StatusCodes.NOT_FOUND, "KP entry not found");
  }

  const wasLeader = entry.isLeader;
  const { hole, category, isLongDrive } = entry;
  const photos = entry.photos ?? [];

  await entry.deleteOne();
  if (photos.length) await deleteFromS3(photos);

  if (wasLeader) {
    const remaining = await KpEntry.find({
      tournament: tournamentId,
      hole,
      category,
      isLongDrive,
    });
    if (remaining.length) {
      remaining.sort((a, b) =>
        isLongDrive ? b.distance - a.distance : a.distance - b.distance,
      );
      const next = remaining[0];
      next.isLeader = true;
      next.dethronedAt = undefined;
      await next.save();
    }
  }

  return { deleted: true };
};

export const KpLiveService = {
  pinHole,
  getPins,
  submitEntry,
  getBoard,
  getCurrentLeaders,
  deleteEntry,
};
