import { Tournament } from "../tournament/tournament.model";
import { User } from "../user/user.model";
import { Club } from "../club/club.model";
import { TournamentResult } from "./tournament.result.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { ITournamentResult } from "./tournament.result.interface";
import { ClubUser } from "../club-users/club.users.model";
import calculateClubHandicap from "../../utils/calculateClubHandicap";

const getAllTournamentResult = async (query: any, userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  const filter: any = { ...query };

  const userQuery = new QueryBuilder<ITournamentResult>(
    TournamentResult.find(),
    filter,
  )
    .search([
      "tournament.tournamentName",
      "skins.hole",
      "challengeMatches.winner.name",
    ])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await userQuery.modelQuery.select("-__v").lean();

  const meta = await userQuery.countTotal();

  return {
    meta,
    results,
  };
};

const getAllTopPlayersResult = async (_query: any) => {
  const players = await User.find({
    clubHandicap: { $gte: 0, $lte: 36 },
    isDeleted: false,
    isBlocked: false,
  })
    .select("name email image clubHandicap createdAt")
    .sort({ clubHandicap: 1, createdAt: 1 }) // Lower handicap = higher rank
    .limit(50)
    .lean();

  // Map the results to include the rank index
  const rankedPlayers = players.map((p: any, index: number) => ({
    _id: p._id,
    name: p.name,
    email: p.email,
    image: p.image || "",
    clubHandicap: p.clubHandicap,
    rank: index + 1,
  }));

  //  Split into Top 3 and the remaining 47
  return {
    top3: rankedPlayers.slice(0, 3),
    next47: rankedPlayers.slice(3),
  };
};

const getLeaderboard = async (clubId: string, _query: any) => {
  const clubUsers = await ClubUser.find({
    club: clubId,
    status: "accepted",
  }).select("user");

  const userIds = clubUsers.map((u: any) => u.user);

  const top50 = await User.find({
    _id: { $in: userIds },
    clubHandicap: { $ne: null },
  })
    .select("fullName email profilePhoto clubHandicap")
    .sort({ clubHandicap: 1 })
    .limit(50)
    .lean();

  return {
    top3: top50.slice(0, 3),
    next47: top50.slice(3),
  };
};

const addTournamentResult = async (payload: any, userId: string) => {
  const tournamentId = payload.tournament;
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (!tournament?.tournamentCreator?.equals(userId)) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "You are not authorized to add result",
    );
  }

  const findClub = await Club.findOne({
    createdBy: userId,
  }).lean();

  if (!findClub) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  if (tournament?.club) {
    await calculateClubHandicap(tournament.club);
  }

  let resultDoc = await TournamentResult.findOne({
    tournament: tournamentId,
  });

  if (!resultDoc) {
    resultDoc = await TournamentResult.create({
      tournament: tournamentId,
    });
  }

  // ===== SKINS =====
  if (payload.skins) {
    const { winner, hole, score, amount, isPaid } = payload.skins;

    const findExistsWinner = await TournamentResult.findOne({
      tournament: tournamentId,
      "skins.user": winner,
    });

    if (findExistsWinner) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "This player already exists in Skins",
      );
    }

    const index = resultDoc.skins.findIndex(
      (s: any) => s.user.toString() === winner && s.hole === hole,
    );

    if (index > -1) {
      // update only provided fields
      if (score !== undefined) resultDoc.skins[index].score = score;
      if (amount !== undefined) resultDoc.skins[index].amount = amount;
      if (isPaid !== undefined) resultDoc.skins[index].isPaid = isPaid;
    } else {
      resultDoc.skins.push({
        user: winner,
        hole,
        score,
        amount,
        isPaid: isPaid ?? false,
      });
    }
  }

  // ===== KPS =====
  if (payload.kps) {
    const { winner, hole, feet } = payload.kps;

    const findExistsWinner = await TournamentResult.findOne({
      tournament: tournamentId,
      "kps.user": winner,
    });

    if (findExistsWinner) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "This player already exists in KPS",
      );
    }

    const index = resultDoc.kps.findIndex(
      (k: any) => k.user.toString() === winner && k.hole === hole,
    );

    if (index > -1) {
      if (feet !== undefined) resultDoc.kps[index].feet = feet;
    } else {
      resultDoc.kps.push({
        user: winner,
        hole,
        feet,
      });
    }
  }

  // ===== CHALLENGE MATCH =====
  if (payload.challengeMatch) {
    const { winner, loser, winnerRound, loserRound } = payload.challengeMatch;

    const findExistsWinner = await TournamentResult.findOne({
      tournament: tournamentId,
      "challengeMatches.winner": winner,
      "challengeMatches.loser": loser,
    });

    if (findExistsWinner) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "This player already exists in Challenge Match",
      );
    }

    const index = resultDoc.challengeMatches.findIndex(
      (c: any) =>
        c.winner.toString() === winner && c.loser.toString() === loser,
    );

    if (index > -1) {
      if (winnerRound !== undefined)
        resultDoc.challengeMatches[index].winnerRound = winnerRound;

      if (loserRound !== undefined)
        resultDoc.challengeMatches[index].loserRound = loserRound;
    } else {
      resultDoc.challengeMatches.push({
        winner,
        loser,
        winnerRound,
        loserRound,
      });
    }
  }

  // ===== PLAYER SCORE =====
  if (payload.playerScore) {
    const { playerName, teeBox, score } = payload.playerScore;

    const findExistsWinner = await TournamentResult.findOne({
      tournament: tournamentId,
      "playerScores.user": playerName,
    });

    if (findExistsWinner) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "This player already exists in Player Score",
      );
    }

    const index = resultDoc.playerScores.findIndex(
      (p: any) => p.user.toString() === playerName,
    );

    if (index > -1) {
      if (teeBox !== undefined) resultDoc.playerScores[index].teeBox = teeBox;

      if (score !== undefined) resultDoc.playerScores[index].score = score;
    } else {
      resultDoc.playerScores.push({
        user: playerName,
        teeBox,
        score,
      });
    }
  }

  await resultDoc.save();

  return resultDoc;
};

const findSingleTournamentResult = async (tournamentId: string) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (tournament?.club) {
    await calculateClubHandicap(tournament.club);
  }

  const result = await TournamentResult.findOne({
    tournament: tournamentId,
  })
    .populate("skins.user", "name email handicap")
    .populate("kps.user", "name email handicap")
    .populate("playerScores.user", "name email handicap")
    .populate("challengeMatches.winner", "name email handicap")
    .populate("challengeMatches.loser", "name email handicap");

  if (!result) {
    return { message: "Result not found for this tournament" };
  }

  return result;
};

const updateTournamentResult = async (
  tournamentId: string,
  userId: string,
  payload: any,
) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const resultDoc = await TournamentResult.findOne({
    tournament: tournamentId,
  });

  if (!resultDoc) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Could not find tournament result",
    );
  }

  const bulkOps: any = [];

  // ===================== SKINS =====================
  if (payload.skins) {
    const items = Array.isArray(payload.skins)
      ? payload.skins
      : [payload.skins];

    items.forEach((item: any) => {
      const id = item._id || item.id;
      if (!id) return;

      const set: any = {};

      if (item.hole !== undefined) set["skins.$.hole"] = item.hole;
      if (item.score !== undefined) set["skins.$.score"] = item.score;
      if (item.amount !== undefined) set["skins.$.amount"] = item.amount;
      if (item.isPaid !== undefined) set["skins.$.isPaid"] = item.isPaid;

      if (Object.keys(set).length === 0) return;

      bulkOps.push({
        updateOne: {
          filter: {
            tournament: tournamentId,
            "skins._id": id,
          },
          update: { $set: set },
        },
      });
    });
  }

  // ===================== KPS =====================
  if (payload.kps) {
    const items = Array.isArray(payload.kps) ? payload.kps : [payload.kps];

    items.forEach((item: any) => {
      const id = item._id || item.id;
      if (!id) return;

      const set: any = {};

      if (item.hole !== undefined) set["kps.$.hole"] = item.hole;
      if (item.feet !== undefined) set["kps.$.feet"] = item.feet;

      if (Object.keys(set).length === 0) return;

      bulkOps.push({
        updateOne: {
          filter: {
            tournament: tournamentId,
            "kps._id": id,
          },
          update: { $set: set },
        },
      });
    });
  }

  // ===================== CHALLENGE MATCHES =====================
  if (payload.challengeMatches) {
    const items = Array.isArray(payload.challengeMatches)
      ? payload.challengeMatches
      : [payload.challengeMatches];

    items.forEach((item: any) => {
      const id = item._id || item.id;
      if (!id) return;

      const set: any = {};

      if (item.winnerRound !== undefined)
        set["challengeMatches.$.winnerRound"] = item.winnerRound;

      if (item.loserRound !== undefined)
        set["challengeMatches.$.loserRound"] = item.loserRound;

      if (Object.keys(set).length === 0) return;

      bulkOps.push({
        updateOne: {
          filter: {
            tournament: tournamentId,
            "challengeMatches._id": id,
          },
          update: { $set: set },
        },
      });
    });
  }

  // ===================== PLAYER SCORES =====================
  if (payload.playerScores) {
    const items = Array.isArray(payload.playerScores)
      ? payload.playerScores
      : [payload.playerScores];

    items.forEach((item: any) => {
      const id = item._id || item.id;
      if (!id) return;

      const set: any = {};

      if (item.score !== undefined) set["playerScores.$.score"] = item.score;

      if (item.teeBox !== undefined) set["playerScores.$.teeBox"] = item.teeBox;

      if (Object.keys(set).length === 0) return;

      bulkOps.push({
        updateOne: {
          filter: {
            tournament: tournamentId,
            "playerScores._id": id,
          },
          update: { $set: set },
        },
      });
    });
  }

  // ===================== EXECUTE BULK UPDATE =====================
  if (bulkOps.length > 0) {
    await TournamentResult.bulkWrite(bulkOps);
  }

  // return fresh updated document
  return await TournamentResult.findOne({
    tournament: tournamentId,
  })
    .populate("skins.user", "name email handicap")
    .populate("kps.user", "name email handicap")
    .populate("challengeMatches.winner", "name email handicap")
    .populate("challengeMatches.loser", "name email handicap")
    .populate("playerScores.user", "name email handicap");
};

export const TournamentResultService = {
  getAllTopPlayersResult,
  getLeaderboard,
  addTournamentResult,
  findSingleTournamentResult,
  updateTournamentResult,
  getAllTournamentResult,
};
