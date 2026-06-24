import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { TeeSheet } from "./tee.sheet.model";
import { formatDateTime, parseTime } from "../../utils/formatDateTime";
import QueryBuilder from "../../shared/queryBuilder";
import { RequestToPlay } from "../request-to-play/request.to.play.model";
import { User } from "../user/user.model";
import { Tournament } from "../tournament/tournament.model";
import { ITournament } from "../tournament/tournament.interface";
import { TeeSheetGroup } from "../tee-sheet-group/teesheet.group.model";

const createTeeSheet = async (userId: string, data: any) => {
  const { tournamentId, groupName, playerList, dateTime } = data;

  if (!playerList || playerList.length < 2) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Minimum 2 players required");
  }

  const groupCount = await TeeSheet.countDocuments({
    tournament: tournamentId,
  });

  const newGroup = await TeeSheet.create({
    tournament: tournamentId,
    groupName,
    groupNumber: groupCount + 1,
    //   players: playerList.map((uid: string) => ({ user: uid })),
    // teeDate: new Date(dateTime),
    // teeTime: new Date(dateTime),
    // createdBy: userId,
    players: playerList.map((uid: string) => ({
      user: new Types.ObjectId(uid),
      isShowChallenge: false,
    })),
    teeDate: new Date(dateTime),
    teeTime: new Date(dateTime),
    createdBy: userId,
  });

  return newGroup;
};

const addPlayerToTeeSheet = async (userId: string, payload: any) => {
  const tee = await TeeSheet.findById(payload.teeSheetId);

  if (!tee) throw new Error("TeeSheet not found");

  if (tee.players.some((p) => p.user?.toString() === payload.userId)) {
    throw new Error("Player already exists");
  }

  if (tee.players.length >= 4) {
    throw new Error("Max 4 players allowed");
  }

  tee.players.push({
    user: new Types.ObjectId(payload.userId),
    isShowChallenge: false,
  });

  await tee.save();

  return tee;
};

const removePlayerFromTeeSheet = async (userId: string, payload: any) => {
  const tee = await TeeSheet.findById(payload.teeSheetId);

  if (!tee) {
    throw new AppError(StatusCodes.NOT_FOUND, "TeeSheet not found");
  }

  tee.players = tee.players.filter(
    (p) => p.user?.toString() !== payload.userId,
  );

  await tee.save();

  return tee;
};

const showAllTeesheetByTournamentId = async (tournamentId: string) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const groups = await TeeSheet.find({
    tournament: tournamentId,
  }).populate("players.user", "name email image");

  const result = groups.map((g) => {
    const players = g.players || [];
    const formatted = formatDateTime(g.teeTime as any);
    return {
      _id: g._id,
      groupName: g.groupName,
      // groupIndex does not exist in schema; use groupNumber as index (starting at 1)
      groupIndex: g.groupNumber,
      //  groupIndex: g.groupId
      teeDate: formatted.date,
      teeTime: formatted.time,
      players,
      filled: players.length,
      remaining: g.maxPlayers - players.length,
      isFull: players.length >= g.maxPlayers,
    };
  });
  return result || [];
};

// groups: result.filter((g) => !g.isFull),
const showMyTournament = async (query: any, _userId: string) => {
  const filter: any = { ...query, isDeleted: false };

  const teesheetQuery = new QueryBuilder<ITournament>(Tournament.find(), filter)
    .search(["tournamentName", "typeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await teesheetQuery.modelQuery
    .select("_id tournamentName typeName")
    .lean();

  const meta = await teesheetQuery.countTotal();

  return {
    meta,
    results,
  };
};

const showTeeSheetGroupById = async (tournamentId: string, query: any) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const { group } = query;

  if (group) {
    const teeGroup = await TeeSheet.findOne({
      tournament: tournamentId,
      groupName: group,
    }).populate("players.user", "name email clubHandicap");

    if (!teeGroup) {
      throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
    }

    // FILTER ONLY AVAILABLE PLAYERS
    const availablePlayers = teeGroup.players.filter(
      (p: any) => p.isShowChallenge === false,
    );

    return {
      groupName: teeGroup.groupName,
      totalPlayers: teeGroup.players.length,

      availablePlayers: availablePlayers.map((p: any) => ({
        userId: p.user?._id,
        name: p.user?.name,
        email: p.user?.email,
        handicap: Number(p.handicap ?? p.user?.clubHandicap ?? 0),
      })),
    };
  }

  const groups = await TeeSheet.find({
    tournament: tournamentId,
  });

  const result = groups.map((g) => {
    const players = g.players || [];

    return {
      _id: g._id,
      groupName: g.groupName,
      groupIndex: g.groupNumber,
      filled: players.length,
      remaining: g.maxPlayers - players.length,
      isFull: players.length >= g.maxPlayers,
    };
  });

  return result;
};

// groups: result.filter((g) => !g.isFull),
const generateGroups = async (tournamentId: string, userId: string) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const playersPerGroup = 4;
  const totalGroups = Math.ceil(tournament.numberOfPlayers / playersPerGroup);

  // 📅 Parse date (DD-MM-YYYY)
  const [day, month, year] = tournament.date.split("-").map(Number);

  const baseDate = new Date(Date.UTC(year, month - 1, day));

  // ⏰ Parse time
  const rawTimeStr = tournament.teeTime || tournament.time || "00:00";
  const { hours, minutes } = parseTime(rawTimeStr as string);

  const groups = [];

  for (let i = 0; i < totalGroups; i++) {
    const teeTime = new Date(baseDate);

    teeTime.setUTCHours(hours, minutes + i * 10, 0, 0);

    const group = await TeeSheet.findOneAndUpdate(
      {
        tournament: tournamentId,
        groupNumber: i + 1,
      },
      {
        tournament: tournamentId,
        groupNumber: i + 1,
        groupName: `Group ${String.fromCharCode(65 + i)}`,
        teeDate: baseDate,
        teeTime,
        teeInterval: 10,
        createdBy: userId,
        $setOnInsert: { players: [] },
      },
      { upsert: true, new: true },
    );

    groups.push(group);
  }

  return groups;
};

const addPlayerToGroup = async (
  teeSheetId: string,
  currentUserId: string,
  payload: any,
) => {
  if (!Types.ObjectId.isValid(teeSheetId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid teeSheetId");
  }

  const { tournamentId, userId, teeDate, teeTime } = payload;

  const userIds = (Array.isArray(userId) ? userId : [userId]).filter(Boolean);

  const group = await TeeSheet.findOne({
    _id: teeSheetId,
    tournament: tournamentId,
  });

  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  const playersPerGroup = group.maxPlayers || 4;

  // Existing users
  const existingIds = group.players.map((p: any) => p.user.toString());

  const alreadyExists = userIds.filter((id: string) =>
    existingIds.includes(id),
  );

  if (alreadyExists.length > 0) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This player already exists in this group",
    );
  }

  // Check accepted players
  const acceptedRequests = await RequestToPlay.find({
    tournament: tournamentId,
    status: "accepted",
    $or: [
      { requestedUser: { $in: userIds } },
      { challengedUser: { $in: userIds } },
    ],
  });

  if (!acceptedRequests.length) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "This player is not accepted for this tournament",
    );
  }

  const newUsers = userIds.filter((id) => !existingIds.includes(id));

  // Capacity check
  if (group.players.length + newUsers.length > playersPerGroup) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Group capacity exceeded");
  }

  // Fetch handicap
  const users = await User.find({
    _id: { $in: newUsers },
  });

  const userMap = new Map(
    users.map((u: any) => [u._id.toString(), Number(u?.handicap || 0)]),
  );

  const newPlayers = newUsers.map((id: any) => ({
    user: id,
    handicap: userMap.get(id) ?? 0,
    isShowChallenge: false,
  }));

  if (teeDate && teeTime) {
    //  "13-04-2026" //  "01:00 PM"
    const [day, month, year] = teeDate.split("-");

    const combined = `${year}-${month}-${day} ${teeTime}`;

    const parsedDateTime = new Date(combined);

    if (isNaN(parsedDateTime.getTime())) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid teeDate or teeTime format",
      );
    }

    // Update ONLY when provided
    group.teeDate = parsedDateTime;
    group.teeTime = parsedDateTime;
  }

  group.players.push(...newPlayers);

  await group.save();

  return newUsers;
};

const removePlayerToGroup = async (
  teeSheetId: string,
  currentUserId: string,
  payload: any,
) => {
  const { tournamentId, userId } = payload;

  const userIds = (Array.isArray(userId) ? userId : [userId]).filter(Boolean);

  if (!userIds.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "userId is required");
  }

  // Find group
  const group = await TeeSheet.findOne({
    _id: teeSheetId,
    tournament: tournamentId,
  });

  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  // Existing players in group
  const existingIds = group.players.map((p: any) => p.user.toString());

  // Validate users exist in group
  const notFoundUsers = userIds.filter((id: any) => !existingIds.includes(id));

  if (notFoundUsers.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Some players are not in this group",
    );
  }

  group.players = group.players.filter(
    (p: any) => !userIds.includes(p.user.toString()),
  );

  await group.save();

  return {
    removedUsers: userIds,
  };
};

const addPlayerAuto = async (userId: string, tournamentId: string) => {
  const groups = await TeeSheetGroup.find({ tournament: tournamentId }).sort({
    groupIndex: 1,
  });

  for (const group of groups) {
    if (group.players.length < group.maxPlayers) {
      const exists = group.players.some((p: any) => p.toString() === userId);

      if (exists) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Already assigned");
      }

      group.players.push(new Types.ObjectId(userId));
      await group.save();

      return group;
    }
  }

  throw new AppError(StatusCodes.BAD_REQUEST, "No available slots");
};

const movePlayer = async (currentUserId: string, payload: any) => {
  const { tournamentId, fromGroup, toGroup, userId } = payload;

  if (!Types.ObjectId.isValid(tournamentId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid tournamentId");
  }

  if (!fromGroup || !toGroup) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "fromGroup and toGroup are required",
    );
  }

  // normalize + sanitize
  const userIds = (Array.isArray(userId) ? userId : [userId])
    .filter(Boolean)
    .filter((id) => Types.ObjectId.isValid(id));

  if (!userIds.length) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid userId");
  }

  const source = await TeeSheet.findOne({
    tournament: tournamentId,
    groupName: fromGroup,
  });

  const target = await TeeSheet.findOne({
    tournament: tournamentId,
    groupName: toGroup,
  });

  if (!source || !target) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  // current players
  const sourceIds = source.players.map((p: any) => p.user.toString());
  const targetIds = target.players.map((p: any) => p.user.toString());

  // validate source membership
  const notInSource = userIds.filter((id) => !sourceIds.includes(id));

  if (notInSource.length > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Users not in source group: ${notInSource.join(", ")}`,
    );
  }

  // fetch users for handicap
  const users = await User.find({ _id: { $in: userIds } });

  const userMap = new Map(
    users.map((u) => [u._id.toString(), Number(u?.handicap || 0)]),
  );

  // filter already in target
  const alreadyInTarget = userIds.filter((id) => targetIds.includes(id));

  const validToMove = userIds.filter((id) => !targetIds.includes(id));

  // capacity check
  if (target.players.length + validToMove.length > target.maxPlayers) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Target group capacity exceeded",
    );
  }

  // REMOVE from source
  source.players = source.players.filter(
    (p: any) => !userIds.includes(p.user.toString()),
  );

  // ADD to target WITH handicap
  const newPlayers = validToMove.map((id) => ({
    user: id,
    handicap: userMap.get(id) ?? 0,
    isShowChallenge: false,
  }));

  target.players.push(...newPlayers);

  await source.save();
  await target.save();

  return {
    moved: validToMove,
    alreadyInTarget,
    from: fromGroup,
    to: toGroup,
  };
};

const updateSingleGroup = async (payload: any, teeSheetId: string) => {
  const { newGroupName, teeDate, teeTime } = payload;

  const group = await TeeSheet.findById(teeSheetId);

  if (!group) {
    throw new AppError(StatusCodes.NOT_FOUND, "Group not found");
  }

  if (newGroupName) {
    const exists = await TeeSheet.findOne({
      _id: { $ne: teeSheetId },
      groupName: newGroupName,
    });

    if (exists) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Group name already exists");
    }

    group.groupName = newGroupName;
  }

  const currentDate = group.teeDate ? new Date(group.teeDate) : new Date();

  // update date only
  if (teeDate) {
    const [day, month, year] = teeDate.split(/[-/]/).map(Number);

    if (!day || !month || !year) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid teeDate format");
    }

    currentDate.setUTCFullYear(year, month - 1, day);
  }

  // update time only
  if (teeTime) {
    const match = teeTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

    if (!match) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid teeTime format");
    }

    let [, hours, minutes] = match;
    const period = match[3];

    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (period.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    }

    if (period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    currentDate.setUTCHours(hours, minutes, 0, 0);
  }

  if (teeDate || teeTime) {
    group.teeDate = currentDate;
    group.teeTime = currentDate;
  }

  await group.save();

  return group;
};

export const TeeSheetService = {
  createTeeSheet,
  addPlayerToTeeSheet,
  showMyTournament,
  addPlayerAuto,
  generateGroups,
  addPlayerToGroup,
  removePlayerToGroup,
  showAllTeesheetByTournamentId,
  removePlayerFromTeeSheet,
  movePlayer,
  showTeeSheetGroupById,
  updateSingleGroup,
};
