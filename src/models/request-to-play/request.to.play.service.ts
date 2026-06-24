import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { rbacPolicy } from "../../policies";
import { Types } from "mongoose";
import { User } from "../user/user.model";
import { RequestToPlay } from "./request.to.play.model";
import { sendNotification } from "../../notifications/notification.service";
import { ClubUser } from "../club-users/club.users.model";
import QueryBuilder from "../../shared/queryBuilder";
import { IRequestToPlay } from "./request.to.play.interface";
import { ClubTournament } from "../club-tournament/club.tournament.model";
import { Tournament } from "../tournament/tournament.model";
import { TeeSheet } from "../tee-sheet/tee.sheet.model";

const makeRequestToplay = async (
  userId: string,
  tournamentId: string,
  challengedUser: string,
) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  // console.log(tournament);
  if (tournament?.status !== "active") {
    throw new AppError(StatusCodes.CONFLICT, "Tournament is not active");
  }

  // normalize ids
  const isChallenged = !!challengedUser;

  // capacity check
  if (tournament.tournamentPlayersList.length >= tournament.numberOfPlayers) {
    throw new AppError(StatusCodes.CONFLICT, "Tournament is already full");
  }

  // safe ObjectId compare
  const isAlreadyInTournament = tournament.tournamentPlayersList.some(
    (id: Types.ObjectId) => id.toString() === userId.toString(),
  );

  if (isAlreadyInTournament) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You are already registered in this tournament",
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const joinPolicy = rbacPolicy.tournament.canJoin(user);
  if (!joinPolicy.allowed) {
    throw new AppError(StatusCodes.FORBIDDEN, joinPolicy.reason);
  }

  if (
    user.status === "suspended" ||
    user.status === "inactive" ||
    user.isDeleted
  ) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You are not allowed to perform this action",
    );
  }

  if (isChallenged) {
    if (!Types.ObjectId.isValid(challengedUser)) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid challenged user");
    }

    const opponent = await User.findById(challengedUser);

    if (!opponent) {
      throw new AppError(StatusCodes.NOT_FOUND, "Opponent not found");
    }

    // opponent already in tournament
    const opponentExists = tournament.tournamentPlayersList.some(
      (id: Types.ObjectId) => id.toString() === challengedUser.toString(),
    );

    if (opponentExists) {
      throw new AppError(
        StatusCodes.CONFLICT,
        "Opponent already joined this tournament",
      );
    }

    // duplicate challenge
    const existingChallenge = await RequestToPlay.findOne({
      requestedUser: userId,
      challengedUser,
      tournament: tournamentId,
      requestType: "challenge",
    });

    if (existingChallenge) {
      throw new AppError(StatusCodes.CONFLICT, "Challenge already sent");
    }

    // create challenge
    const challenge = await RequestToPlay.create({
      requestedUser: userId,
      challengedUser,
      tournamentcreator: tournament.tournamentCreator,
      tournament: tournamentId,
      tournamentType: tournament.typeName,
      requestType: "challenge",
      status: "pending",
    });

    // notify challenged user
    await sendNotification({
      sender: userId,
      receiver: challengedUser,
      tournamentId,
      isRequest: true,
      title: "Challenge Request",
      body: `${user.name} challenged you to join tournament "${tournament.tournamentName}"`,
      type: "tournament",
      linkId: `/tournament/${tournamentId}/challenge`,
    });

    return {
      type: "challenge",
      data: challenge,
    };
  }

  const existingRequest = await RequestToPlay.findOne({
    requestedUser: userId,
    tournament: tournamentId,
    requestType: "open",
  });

  if (existingRequest) {
    throw new AppError(StatusCodes.CONFLICT, "You already requested to join");
  }
  //  find club and join requested player on this
  const findClub = await ClubTournament.findOne({
    tournament: tournamentId,
  });

  const findReqJoinToClub = await ClubUser.findOne({
    club: findClub?._id,
    user: userId,
  });

  if (!findReqJoinToClub) {
    await ClubUser.create({
      club: findClub?._id,
      user: userId,
    });
  }

  const request = await RequestToPlay.create({
    requestedUser: userId,
    tournamentcreator: tournament.tournamentCreator,
    tournament: tournamentId,
    tournamentType: tournament.typeName,
    requestType: "open",
    status: "pending",
  });

  // notify tournament creator
  await sendNotification({
    sender: userId,
    receiver: tournament.tournamentCreator,
    tournamentId,
    isRequest: true,
    title: "Tournament Join Request",
    body: `${user.name} requested to join "${tournament.tournamentName}"`,
    type: "tournament",
    linkId: `/tournament/${tournamentId}/requested`,
  });

  return request;
};

const showAllrequestedtournament = async (userId: string, query: any) => {
  const filter = {
    tournamentcreator: new Types.ObjectId(userId),
    isDeleted: false,
  };

  const requestQuery = new QueryBuilder<IRequestToPlay>(
    RequestToPlay.find(filter)
      .populate("requestedUser", "name email image dateOfBirth handicap")
      .populate(
        "tournament",
        "tournamentName courseName date time tournamentType",
      ),
    query,
  )
    .search(["requestedUser.name", "tournament.tournamentName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await requestQuery.modelQuery.lean();

  const meta = await requestQuery.countTotal();

  return {
    meta,
    results,
  };
};

const showAllUserRequestedtournament = async (userId: string, query: any) => {
  const filter = {
    tournamentcreator: new Types.ObjectId(userId),
  };

  const requestQuery = new QueryBuilder<IRequestToPlay>(
    RequestToPlay.find(filter),
    query,
  )
    .search(["requestedUser.name", "challengedUser.name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  let results: any = await requestQuery.modelQuery
    .populate("requestedUser", "name email image country handicap")
    .populate("challengedUser", "name email image country handicap")
    .populate({
      path: "tournament",
      select: "tournamentName courseName date time tournamentType club",
      populate: {
        path: "club",
        select: "name clubLogo city",
      },
    })
    .lean();

  // Remove challengedUser if null
  results = results.map((item: any) => {
    if (!item.challengedUser) {
      const { challengedUser, ...rest } = item;
      return rest;
    }
    return item;
  });

  const meta = await requestQuery.countTotal();

  return {
    meta,
    results,
  };
};

const findAvailablePlayerForTournament = async (
  tournamentId: string,
  userId: string,
  query: any,
) => {
  //  Get assigned players
  const teeSheets = await TeeSheet.find({
    tournament: tournamentId,
  }).select("players.user");

  const assignedUserIds = teeSheets.flatMap((t: any) =>
    t.players.map((p: any) => p.user),
  );

  //  Base query with exclusion
  const filter: any = {
    tournament: new Types.ObjectId(tournamentId),
    tournamentcreator: new Types.ObjectId(userId),
    requestedUser: { $nin: assignedUserIds },
    status: "accepted",
  };

  const requestQuery = new QueryBuilder<IRequestToPlay>(
    RequestToPlay.find(filter),
    query,
  )
    .search(["requestedUser.name", "challengedUser.name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  let results: any = await requestQuery.modelQuery
    .populate("requestedUser", "name email image country handicap")
    .populate("challengedUser", "name email image country handicap")
    .select("-tournament -createdAt -updatedAt -__v")
    .lean();

  // Remove null challengedUser
  results = results.map((item: any) => {
    if (!item.challengedUser) {
      const { challengedUser, ...rest } = item;
      return rest;
    }
    return item;
  });

  const meta = await requestQuery.countTotal();

  return {
    meta,
    results,
  };
};

const showrequestDetalsById = async (id: string) => {
  const result = await RequestToPlay.findById(id)
    .populate("requestedUser", "name image")
    .populate("tournament", "-tournamentPlayersList -tournamentCreator")
    .lean();
  return result;
};

// aproved requiest

const aprovedTheRequest = async (
  tournamentId: string,
  userId: string,
  approveUserId: string,
) => {
  const tournament: any = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const isExistTournament = await RequestToPlay.findOne({
    tournamentcreator: new Types.ObjectId(userId),
    requestedUser: new Types.ObjectId(approveUserId),
    tournament: new Types.ObjectId(tournamentId),
  });

  if (!isExistTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "request tournament not found");
  }

  if (
    tournament.tournamentPlayersList.includes(isExistTournament?.requestedUser)
  ) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "you already registered in this tournament",
    );
  }

  if (tournament.tournamentPlayersList.length >= tournament.numberOfPlayers) {
    throw new AppError(StatusCodes.CONFLICT, "Tournament is already full");
  }

  tournament.tournamentPlayersList.push(isExistTournament?.requestedUser);

  await tournament.save();

  const result = await RequestToPlay.findByIdAndUpdate(
    isExistTournament._id,
    { status: "accepted" },
    { new: true },
  );

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "request tournament result not found",
    );
  }

  await sendNotification({
    sender: result.tournamentcreator,
    receiver: result.requestedUser,
    tournamentId: result.tournament?._id,
    title: `You have been approved for the ${result.requestType} tournament`,
    body: `Your request has been approved by the tournament creator`,
    type: "tournament",
    linkId: `/request-to-play/${tournamentId}`,
  });

  //  find club and join requested player on this
  const findClub = await ClubTournament.findOne({
    tournament: tournamentId,
  });

  const findReqJoinToClub = await ClubUser.findOne({
    club: findClub?._id,
    user: isExistTournament?.requestedUser,
  });

  if (findReqJoinToClub) {
    findReqJoinToClub.status = "accepted";
    await findReqJoinToClub.save();
  }

  return result;
};

const aprovedTheRequestThrowNotification = async (
  tournamentId: string,
  userId: string,
  approveUserId: string,
) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const isExistTournament = await RequestToPlay.findOne({
    tournamentcreator: new Types.ObjectId(userId),
    requestedUser: new Types.ObjectId(approveUserId),
    tournament: new Types.ObjectId(tournamentId),
  });

  if (!isExistTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "request tournament not found");
  }

  if (
    tournament.tournamentPlayersList.includes(isExistTournament?.requestedUser)
  ) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "you already registered in this tournament",
    );
  }

  if (tournament.tournamentPlayersList.length >= tournament.numberOfPlayers) {
    throw new AppError(StatusCodes.CONFLICT, "Tournament is already full");
  }

  tournament.tournamentPlayersList.push(isExistTournament?.requestedUser);

  await tournament.save();

  const result = await RequestToPlay.findByIdAndUpdate(
    isExistTournament._id,
    { status: "accepted" },
    { new: true },
  );

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "request tournament result not found",
    );
  }

  await sendNotification({
    sender: result.tournamentcreator,
    receiver: result.requestedUser,
    tournamentId: result.tournament?._id,
    title: `You have been approved for the ${result.requestType} tournament`,
    body: `Your request has been approved by the tournament creator`,
    type: "tournament",
    linkId: `/request-to-play/${tournamentId}`,
  });

  //  find club and join requested player on this
  const findClub = await ClubTournament.findOne({
    tournament: tournamentId,
  });

  const findReqJoinToClub = await ClubUser.findOne({
    club: findClub?._id,
    user: isExistTournament?.requestedUser,
  });

  if (findReqJoinToClub) {
    findReqJoinToClub.status = "accepted";
    await findReqJoinToClub.save();
  }

  return result;
};

const cancelRequest = async (
  tournamentId: string,
  userId: string,
  rejectUserId: string,
) => {
  const isExistTournament = await RequestToPlay.findOne({
    tournamentcreator: new Types.ObjectId(userId),
    requestedUser: new Types.ObjectId(rejectUserId),
    tournament: new Types.ObjectId(tournamentId),
  });

  if (!isExistTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "request tournament not found");
  }

  const tournament = await Tournament.findById(isExistTournament.tournament);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const result = await RequestToPlay.findByIdAndUpdate(
    isExistTournament._id,
    { status: "rejected" },
    { new: true },
  );

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "request tournament result not found",
    );
  }

  await sendNotification({
    sender: result.tournamentcreator,
    receiver: result.requestedUser,
    tournamentId: result.tournament,
    title: `You have been canceled for the ${result.requestType} tournament`,
    body: ` Your request has been canceled by the tournament creator. Please try joining other tournaments.`,
    type: "tournament",
    linkId: `/request-to-play/${isExistTournament._id}`,
  });

  return result;
};

export const RequestToPlayService = {
  makeRequestToplay,
  showAllUserRequestedtournament,
  showAllrequestedtournament,
  findAvailablePlayerForTournament,
  showrequestDetalsById,
  aprovedTheRequest,
  aprovedTheRequestThrowNotification,
  cancelRequest,
};
