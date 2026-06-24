import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { ITournament } from "./tournament.interface";
import { rbacPolicy } from "../../policies";
import { Tournament } from "./tournament.model";
import { TeeSheetService } from "../tee-sheet/tee.sheet.service";
import { ClubTournament } from "../club-tournament/club.tournament.model";
import { sendNotification } from "../../notifications/notification.service";
import { haversine } from "../../utils/distance.Calculate";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";
import { RequestToPlay } from "../request-to-play/request.to.play.model";

const createTournament = async (
  tournamentBody: ITournament,
  userId: string,
) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Prepare the data object with proper coordinates
  const data = {
    ...tournamentBody,
    tournamentCreator: userId,
    isApproved: true,
    courseLocation: findUser.myLocation,
    club: findUser.club,
  };

  const policyCheck = rbacPolicy.tournament.canCreate(findUser, data.typeName);
  if (!policyCheck.allowed) {
    throw new AppError(StatusCodes.BAD_REQUEST, policyCheck.reason);
  }

  // console.log(data, "data in service", findUser?.club, "findUser club");

  if (data?.typeName === "big" && findUser?.club === null) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You cannot create big tournaments, please create a club to create big tournaments",
    );
  }

  // Create a new tournament using the Tournament model

  const tournament = await Tournament.create(data);

  // create group

  await TeeSheetService.generateGroups(tournament?._id.toString(), userId);

  if (findUser?.club) {
    await ClubTournament.create({
      club: findUser.club,
      clubCreator: userId,
      tournament: tournament?._id,
    });
  }

  // Send notification to the tournament creator
  await sendNotification({
    sender: userId,
    receiver: tournament.tournamentCreator,
    tournamentId: tournament._id,
    title: "New Tournament Created",
    body: `You have created a new tournament: ${tournament.tournamentName}.`,
    type: "tournament",
    linkId: `/tournament/${tournament._id}`,
  });

  return tournament;
};

const getTournaments = async (query: any, userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  let geoNearStage;

  try {
    geoNearStage = rbacPolicy.tournament.geoQuery(findUser);
  } catch (error: any) {
    throw new Error(error.message);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const savedCoords = findUser.myLocation?.coordinates;

  // Fetch nearby tournaments with pagination
  const nearbyTournaments = await Tournament.aggregate([
    geoNearStage,
    {
      $match: {
        isApproved: true,
        isRejected: false,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  // Add distance fields
  const tournamentsWithDistance = nearbyTournaments.map((tournament) => {
    const tournamentLat = tournament.courseLocation.coordinates[1];
    const tournamentLon = tournament.courseLocation.coordinates[0];

    let distanceToUser = null;

    if (savedCoords?.length === 2) {
      const userLat = savedCoords[1];
      const userLon = savedCoords[0];

      distanceToUser = haversine(
        userLat,
        userLon,
        tournamentLat,
        tournamentLon,
      );
    }

    return {
      ...tournament,
      distanceToCurrentLocation: Number(
        (tournament.distance / 1000).toFixed(2),
      ),
      distanceToUser:
        distanceToUser !== null ? Number(distanceToUser.toFixed(2)) : null,
    };
  });

  // Total count
  const totalTournaments = await Tournament.aggregate([
    geoNearStage,
    {
      $match: {
        isApproved: true,
        isRejected: false,
      },
    },
    {
      $count: "total",
    },
  ]);

  const total = totalTournaments[0]?.total || 0;

  return {
    meta: {
      totalResult: total,
      currentPage: page,
      limit,
      totalPage: Math.ceil(total / limit),
    },

    results: tournamentsWithDistance,
  };
};

const getAllTournament = async (query: any, userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  let geoNearStage;

  try {
    geoNearStage = rbacPolicy.tournament.geoQuery(findUser);
  } catch (error: any) {
    throw new Error(error.message);
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const search = query.search || "";
  const status = query.status || "";

  // Dynamic match query
  const matchQuery: any = {
    status: "active",
  };

  if (status) {
    matchQuery.typeName = {
      $regex: status,
      $options: "i",
    };
  }

  if (search) {
    matchQuery.$or = [
      {
        tournamentName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        city: {
          $regex: search,
          $options: "i",
        },
      },
      {
        courseName: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // Aggregation pipeline
  const aggregationPipeline: any[] = [
    geoNearStage,

    {
      $match: matchQuery,
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },
  ];

  const tournaments = await Tournament.aggregate(aggregationPipeline);

  // Distance calculation (meters -> km)
  const tournamentsWithDistance = tournaments.map((tournament) => ({
    ...tournament,
    distanceToCurrentLocation: Number((tournament.distance / 1000).toFixed(2)),
  }));

  // Count pipeline
  const countPipeline: any[] = [
    geoNearStage,

    {
      $match: matchQuery,
    },

    {
      $count: "totalCount",
    },
  ];

  const totalTournaments = await Tournament.aggregate(countPipeline);

  const total = totalTournaments[0]?.totalCount || 0;

  return {
    meta: {
      totalResult: total,
      currentPage: page,
      limit,
      totalPage: Math.ceil(total / limit),
    },

    results: tournamentsWithDistance,
  };
};

const getAllMyTournamentCommon = async (query: any, userId: string) => {
  const filter: any = {
    ...query,
    tournamentCreator: new Types.ObjectId(userId),
    status: { $ne: "closed" },
  };

  const userQuery = new QueryBuilder<ITournament>(Tournament.find(), filter)
    .search(["tournamentName", "city", "courseName", "typeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await userQuery.modelQuery
    .select("_id tournamentName typeName city courseName")
    .lean();

  const meta = await userQuery.countTotal();

  return {
    meta,
    results,
  };
};

const getAllEnteredTournaments = async (query: any, userId: string) => {
  const userObjectId = new Types.ObjectId(userId);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const createdFilter: any = {
    tournamentCreator: userObjectId,
    typeName: "small",
    status: { $ne: "closed" },
  };

  const createdQuery = new QueryBuilder<ITournament>(Tournament.find(), {
    ...query,
    ...createdFilter,
  })
    .search(["tournamentName", "city", "courseName", "typeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const createdTournaments = await createdQuery.modelQuery.lean();

  const joinedRequests = await RequestToPlay.find({
    requestedUser: userObjectId,
    status: "accepted",
  })
    .populate({
      path: "tournament",
      match: {
        status: { $ne: "closed" },
      },
    })
    .lean();

  const joinedTournaments = joinedRequests
    .map((doc: any) => doc.tournament)
    .filter(Boolean);

  const createdIds = new Set(createdTournaments.map((t) => t._id.toString()));

  const filteredJoined = joinedTournaments.filter(
    (t: any) => !createdIds.has(t._id.toString()),
  );

  const createdWithFlag = createdTournaments.map((t) => ({
    ...t,
    isTournamentCreator: true,
    isJoined: true,
  }));

  const joinedWithFlag = filteredJoined.map((t: any) => ({
    ...t,
    isTournamentCreator: false,
    isJoined: true,
  }));

  const allTournaments = [...createdWithFlag, ...joinedWithFlag];

  allTournaments.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const total = allTournaments.length;

  const skip = (page - 1) * limit;

  const results = allTournaments.slice(skip, skip + limit);

  return {
    meta: {
      totalResult: total,
      currentPage: page,
      limit,
      totalPage: Math.ceil(total / limit),
    },

    results,
  };
};

const getMyAllTournament = async (query: any, userId: string) => {
  const filter: any = {
    tournamentCreator: new Types.ObjectId(userId),
    ...query,
  };

  const tournamentQuery = new QueryBuilder<ITournament>(
    Tournament.find(),
    filter,
  )
    .search(["tournamentName", "city", "courseName", "typeName", "status"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await tournamentQuery.modelQuery
    .select("_id tournamentName typeName city courseName")
    .lean();

  const meta = await tournamentQuery.countTotal();

  return {
    meta,
    results,
  };
};

const getAllCompleteTournament = async (query: any, userId: string) => {
  const filter: any = {
    tournamentCreator: new Types.ObjectId(userId),
    status: "completed",
    ...query,
  };

  const tournamentQuery = new QueryBuilder<ITournament>(
    Tournament.find(),
    filter,
  )
    .search(["tournamentName", "city", "courseName", "typeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await tournamentQuery.modelQuery
    .select("_id tournamentName typeName city courseName")
    .lean();

  const meta = await tournamentQuery.countTotal();

  return {
    meta,
    results,
  };
};

const getTournamentFindById = async (tournamentId: string) => {
  // Find a tournament by its ID
  const tournament = await Tournament.findById(tournamentId)
    .populate("club", "-__v -createdAt -updatedAt -isDeleted -location")
    .populate("tournamentCreator", "name email country image coverImage")
    .select("-__v")
    .lean();

  // If tournament not found, throw a custom error
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  const findApprovedUsers = await RequestToPlay.find({
    tournament: new Types.ObjectId(tournamentId),
    status: "accepted",
  });

  return { tournament, approvedUsersList: findApprovedUsers };
};

const updateTournament = async (
  updateData: any,
  userId: string,
  tournamentId: string,
) => {
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (updateData?.typeName) {
    throw new AppError(StatusCodes.BAD_REQUEST, "typeName cannot be updated");
  }

  // If clubName is being updated, check for duplication
  // if (updateData.clubName && updateData.clubName !== tournament.clubName) {
  //     const exists = await Tournament.findOne({ clubName: updateData.clubName });
  //     if (exists) {
  //         throw new AppError(StatusCodes.CONFLICT, "Club name already exists");
  //     }
  // }

  if (updateData.longitude && updateData.latitude) {
    updateData.courseLocation = {
      coordinates: [updateData.longitude, updateData.latitude],
    };
  }

  Object.assign(tournament, updateData);
  await tournament.save();
  return tournament;
};

const deleteTournament = async (tournamentId: string, userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (
    user.role !== "admin" &&
    tournament.tournamentCreator.toString() !== userId
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this tournament",
    );
  }

  // Find and delete the tournament by ID
  const deletedTournament = await Tournament.findByIdAndDelete(tournamentId);

  // If tournament not found, throw a custom error
  if (!deletedTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  return deletedTournament;
};

// make requiest payemnt for the touranemnt

const makeRequestToPlay = async (tournamentId: string, userId: string) => {
  // Find the tournament by ID
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  // Check if the tournament is already full
  if (tournament.tournamentPlayersList.length >= tournament.numberOfPlayers) {
    throw new AppError(StatusCodes.CONFLICT, "Tournament is already full");
  }

  // Check if the user is already in the tournament
  const userObjectId = new Types.ObjectId(userId);
  if (tournament.tournamentPlayersList.some((id) => id.equals(userObjectId))) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "you  already registered in this tournament",
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

  // Add user to tournamentPlayersList
  tournament.tournamentPlayersList.push(userObjectId);
  await tournament.save();

  await sendNotification({
    sender: userId,
    receiver: tournament.tournamentCreator,
    tournamentId,
    title: "New Tournament Join Request",
    body: `A new player has joined your tournament: ${tournament.tournamentName}`,
    type: "tournament",
    linkId: `/tournament/${tournamentId}`,
  });

  return tournament;
};

const showAllMyTournanmnetForRequest = async (userId: string) => {
  const allRequestsmallTournamet = await Tournament.find({
    isApproved: false,
    tournamentCreator: new Types.ObjectId(userId),
    isRejected: false,
  }).populate("club", "-__v -createdAt -updatedAt -isDeleted -location");

  return allRequestsmallTournamet;
};

const showAllTournanmnetForRequestAproved = async (
  tournamentId: string,
  userId: string,
) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (tournament.tournamentCreator.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this tournament",
    );
  }

  const results = await Tournament.findByIdAndUpdate(
    tournamentId,
    { isApproved: true, isRejected: false },
    { new: true },
  );

  return results;
};

const showAllMyTournanmnetForRequestRejected = async (
  tournamentId: string,
  userId: string,
) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  if (tournament.tournamentCreator.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this tournament",
    );
  }

  const allRequestsmallTournamet = await Tournament.findByIdAndUpdate(
    tournamentId,
    { isRejected: true, isApproved: false },
    { new: true },
  );

  return allRequestsmallTournamet;
};

const showallAprovedTourmant = async (userId: string) => {
  const results = await Tournament.find({
    isApproved: true,
    tournamentCreator: new Types.ObjectId(userId),
  }).populate("club", "-__v -createdAt -updatedAt -isDeleted -location");

  return results;
};

const showallRejectTourmant = async (userId: string) => {
  const allRequestsmallTournamet = await Tournament.find({
    isRejected: true,
    tournamentCreator: new Types.ObjectId(userId),
  }).populate("club", "-__v -createdAt -updatedAt -isDeleted -location");

  return allRequestsmallTournamet;
};

const getAllUsersInTournament = async (tournId: string, search: string) => {
  const tournamentId = new Types.ObjectId(tournId);
  console.log(tournamentId, search);
  const findTournament = await Tournament.findById(tournamentId);

  if (!findTournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }
  // const findUserInTournament = await RequestToPlay.findById(tournamentId);
  const users = await RequestToPlay.find({
    tournament: tournamentId,
    status: "accepted",
  })
    .populate({
      path: "requestedUser",
      select: "name email image",
      match: search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {},
    })
    .lean();

  // ✅ Extract ONLY user objects
  const result = users
    .map((item) => item.requestedUser)
    .filter((u) => u !== null); // remove unmatched (search case)

  return result;
};

export const TournamentService = {
  createTournament,
  getAllTournament,
  getAllMyTournamentCommon,
  getAllCompleteTournament,
  getMyAllTournament,
  getTournaments,
  getAllEnteredTournaments,
  getTournamentFindById,
  updateTournament,
  deleteTournament,
  makeRequestToPlay,
  showallRejectTourmant,
  showallAprovedTourmant,
  showAllMyTournanmnetForRequestRejected,
  showAllTournanmnetForRequestAproved,
  showAllMyTournanmnetForRequest,
  getAllUsersInTournament,
};
