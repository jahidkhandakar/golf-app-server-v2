import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { Club } from "./club.model";
import AppError from "../../errors/AppError";
import { PipelineStage, Types } from "mongoose";
import { parseSort } from "../../utils/parseSort";
import QueryBuilder from "../../shared/queryBuilder";
import { rbacPolicy } from "../../policies";
import { ClubUser } from "../club-users/club.users.model";
import { sendNotification } from "../../notifications/notification.service";

const getAllClubs = async (query: any, userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const currentCoords = user.currentLocation?.coordinates;
  const savedCoords = user.myLocation?.coordinates;

  const isValidCurrent =
    currentCoords && (currentCoords[0] !== 0 || currentCoords[1] !== 0);

  const activeCoords = isValidCurrent ? currentCoords : savedCoords;

  if (!activeCoords) {
    throw new Error("No valid user location found");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchTerm = query.searchTerm || "";

  const userLocationPoint: { type: "Point"; coordinates: [number, number] } = {
    type: "Point",
    coordinates: activeCoords as [number, number],
  };
  const maxDistanceInMeters = 60000;

  // Dynamic match query
  const matchQuery: any = {
    isDeleted: false,
  };

  if (searchTerm) {
    matchQuery.$or = [
      {
        name: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        city: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchTerm,
          $options: "i",
        },
      },
    ];
  }

  // Sorting
  const sort = (query.sort as string)?.split(",").join(" ") || "-createdAt";

  // Fields Selection
  const projectFields: any = {
    name: 1,
    clubLogo: 1,
    location: 1,
    city: 1,
    description: 1,
    maxPlayers: 1,
    totalPlayers: 1,
    createdAt: 1,
    distance: 1,
    "createdBy.name": 1,
    "createdBy.email": 1,
    "createdBy.image": 1,
    "createdBy.phone": 1,
  };

  // Aggregation pipeline
  const pipeline: any[] = [
    {
      $geoNear: {
        near: userLocationPoint,
        distanceField: "distance",
        maxDistance: maxDistanceInMeters,
        spherical: true,
        key: "location",
      },
    },

    {
      $match: matchQuery,
    },

    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },

    {
      $unwind: "$createdBy",
    },

    {
      $sort: parseSort(sort),
    },

    {
      $skip: skip,
    },

    {
      $limit: limit,
    },

    {
      $project: projectFields,
    },
  ];

  const clubs = await Club.aggregate(pipeline);

  // Distance convert KM
  const clubsWithDistance = clubs.map((club) => ({
    ...club,
    distanceInKm: Number((club.distance / 1000).toFixed(2)),
  }));

  // Count Pipeline
  const countPipeline: PipelineStage[] = [
    {
      $geoNear: {
        near: userLocationPoint,
        distanceField: "distance",
        maxDistance: maxDistanceInMeters,
        spherical: true,
        key: "location",
      },
    },

    {
      $match: matchQuery,
    },

    {
      $count: "total",
    },
  ];

  const totalData = await Club.aggregate(countPipeline);

  const total = totalData[0]?.total || 0;

  return {
    meta: {
      totalResult: total,
      currentPage: page,
      limit,
      totalPage: Math.ceil(total / limit),
    },

    results: clubsWithDistance,
  };
};

const getMyClubs = async (query: any, userId: string) => {
  const filter = {
    createdBy: new Types.ObjectId(userId),
    isDeleted: false,
  };

  const clubQuery = new QueryBuilder(
    Club.find(filter).populate(
      "createdBy",
      "name email image dateOfBirth handicap",
    ),
    query,
  )
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await clubQuery.modelQuery.lean();

  const meta = await clubQuery.countTotal();

  return {
    meta,
    results,
  };
};

const createClub = async (data: any, userId: string) => {
  const findUser = await User.findById(userId);
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const policyCheck = rbacPolicy.club.canCreate(findUser);
  if (!policyCheck.allowed) {
    throw new AppError(StatusCodes.FORBIDDEN, policyCheck.reason);
  }

  const findClub = await Club.findOne({
    createdBy: userId,
  }).lean();

  if (findClub) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You have already created a club",
    );
  }

  const formData = {
    ...data,
    createdBy: userId,
    location: findUser.myLocation,
  };

  const result = await Club.create(formData);

  await User.findByIdAndUpdate(userId, {
    club: result._id,
  });

  return result;
};

const showClubById = async (id: string, userId: string) => {
  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Club ID is required");
  }

  const club = await Club.findById(id).lean();

  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  const isCreator = club.createdBy.toString() === userId.toString();

  // Always fetch accepted users (for both cases)
  const clubUsers = await ClubUser.find({
    club: id,
    status: "accepted",
  })
    .populate("user", "name email image status dateOfBirth handicap")
    .lean();

  // Only fetch pending if creator
  let requestedUsers: any[] = [];

  if (isCreator) {
    requestedUsers = await ClubUser.find({
      club: id,
      status: "pending",
    })
      .populate("user", "name email image status dateOfBirth handicap")
      .lean();
  }

  return {
    club,
    clubUsers,
    ...(isCreator && { requestedUsers }),
    isCreator,
  };
};

const updateClub = async (id: string, data: any, userId: string) => {
  if (!id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Club ID is required");
  }

  const findUser = await User.findById(userId);
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await Club.findByIdAndUpdate(id, data, { new: true });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }
  return result;
};

const requestToJoinClub = async (clubId: string, userId: string) => {
  if (!clubId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Club ID is required");
  }

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  const findClub = await Club.findById(clubId);
  if (!findClub) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  const findUser = await User.findById(userId);
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const findClubUser = await ClubUser.findOne({
    club: clubId,
    user: userId,
  });

  if (findClubUser) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You have already requested to join this club",
    );
  }

  if (findClub.createdBy.toString() === userId.toString()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You are the creator of this club",
    );
  }

  const formData = {
    club: clubId,
    user: userId,
  };

  const result = await ClubUser.create(formData);

  // notify challenged user
  await sendNotification({
    sender: userId,
    receiver: findClub.createdBy,
    title: "Tournament Join Request",
    body: ` ${findUser.name} has requested to join your club "${findClub.name}". Accept or decline the request.`,
    type: "general",
    linkId: `/club/${clubId}`,
  });

  return result;
};

const getPendingUsers = async (
  clubId: string,
  userId: string,
  limit = 10,
  page = 1,
) => {
  if (!clubId || !Types.ObjectId.isValid(clubId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Club ID");
  }

  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid User ID");
  }

  const club = await Club.findOne({ _id: clubId, createdBy: userId });
  if (!club) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Club not found or access denied",
    );
  }

  const totalCount = await ClubUser.countDocuments({
    club: clubId,
    status: "pending",
  });

  const pendingUsers = await ClubUser.find({ club: clubId, status: "pending" })
    .populate("user", "name email image phone address dateOfBirth handicap")
    .populate("club", "-__v -createdAt -updatedAt -isDeleted -totalPlayers")
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { pendingUsers, totalCount };
};

const getJoinedUsers = async (clubId: string, query: any) => {
  if (!clubId || !Types.ObjectId.isValid(clubId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid Club ID");
  }

  const club = await Club.findById(clubId);
  if (!club) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  const filter = {
    club: clubId,
    status: "accepted",
  } as any;

  const joinedUserQuery = new QueryBuilder(
    ClubUser.find(filter)
      .populate("user", "name email image phone address dateOfBirth handicap")
      .populate("club", "-__v -createdAt -updatedAt -isDeleted -totalPlayers"),
    query,
  )
    .search([]) // no searchable fields for now (or add user fields if you want)
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await joinedUserQuery.modelQuery.lean();

  const meta = await joinedUserQuery.countTotal();

  return {
    meta,
    results,
  };
};

const acceptedRequestToJoinClub = async (
  clubId: string,
  userId: string,
  joinUserId: string,
) => {
  if (!clubId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Club ID is required");
  }

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  if (!joinUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  const findClub = await Club.findOne({
    createdBy: userId,
    _id: clubId,
  });

  if (!findClub) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  const findUser = await User.findById(joinUserId);
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  const isClubOwnerUser = await User.findById(userId);

  if (!isClubOwnerUser) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User is not authorized to accept this request",
    );
  }
  // return { clubId, userId, joinUserId }
  const findClubUser = await ClubUser.findOne({
    club: clubId,
    user: joinUserId,
  });
  //  const findClubUser = await ClubUser.findOne({
  //     club: clubId,
  //     user: userId,
  //   });
  if (!findClubUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club user not found");
  }

  if (findClubUser.status === "accepted") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User has already accepted the request",
    );
  }

  if (findClubUser.status === "rejected") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User has already rejected the request",
    );
  }

  const result = await ClubUser.findByIdAndUpdate(
    findClubUser._id,
    {
      status: "accepted",
    },
    { new: true },
  );

  await Club.findByIdAndUpdate(clubId, {
    $inc: { totalPlayers: 1 },
  });

  // notify challenged user
  await sendNotification({
    sender: userId,
    receiver: joinUserId,
    title: " Club Join Request Accepted",
    body: `Hi ${findUser.name}, your request to join the club "${findClub.name}" has been accepted.`,
    type: "general",
    linkId: `/club/${clubId}`,
  });

  return result;
};

const rejectRequestToJoinClub = async (
  clubId: string,
  userId: string,
  rejectedUserId: string,
) => {
  if (!clubId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Club ID is required");
  }

  if (!userId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  if (!rejectedUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User ID is required");
  }

  const findClub = await Club.findOne({
    createdBy: userId,
    _id: clubId,
  });

  if (!findClub) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club not found");
  }

  const findUser = await User.findById(rejectedUserId);
  if (!findUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  const isClubOwnerUser = await User.findById(userId);

  if (!isClubOwnerUser) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User is not authorized to accept this request",
    );
  }

  const findClubUser = await ClubUser.findOne({
    club: clubId,
    user: rejectedUserId,
  });

  if (!findClubUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Club user not found");
  }

  if (findClubUser.status === "accepted") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User has already accepted the request",
    );
  }

  if (findClubUser.status === "rejected") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User has already rejected the request",
    );
  }

  const result = await ClubUser.findByIdAndUpdate(
    findClubUser._id,
    {
      status: "rejected",
    },
    { new: true },
  );
  // notify challenged user
  await sendNotification({
    sender: userId,
    receiver: rejectedUserId,
    title: " Club Join Request Rejected",
    body: `Hi ${findUser.name}, your request to join the club "${findClub.name}" has been rejected.`,
    type: "general",
    linkId: `/club/${clubId}`,
  });
  return result;
};

export const ClubService = {
  getAllClubs,
  getMyClubs,
  createClub,
  showClubById,
  updateClub,
  getJoinedUsers,
  requestToJoinClub,
  acceptedRequestToJoinClub,
  getPendingUsers,
  rejectRequestToJoinClub,
};
