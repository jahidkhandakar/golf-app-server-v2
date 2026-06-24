import { Types } from "mongoose";
import { rbacPolicy } from "../../policies";
import { User } from "../user/user.model";
import { LookingToPlay } from "./looking.to.play.model";
import { Invitation } from "../invitation/invitation.model";
import { sendNotification } from "../../notifications/notification.service";
import { Tournament } from "../tournament/tournament.model";

const lookingToPlayCreate = async (userId: string, data: any) => {
  const user = await User.findById(userId);

  if (!data.latitude || !data.longitude) {
    throw new Error("Latitude and Longitude are required");
  }

  const payload = {
    category: data.category,
    golfCourse: data.golfCourse,
    cityToPlay: data.cityToPlay,
    fromDate: new Date(data.fromDate),
    toDate: new Date(data.toDate),

    userName: user?.name,
    createdBy: userId,
    visitingFromName: data.visitingFrom,
    // visitingFrom: user.myLocation,
    visitingFrom: {
      type: "Point" as const,
      coordinates: [data.longitude, data.latitude] as [number, number], // IMPORTANT: lng, lat
    },
  };

  return await LookingToPlay.create(payload);
};

const showAllLookingToPlay = async (userId: string, query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = query.search || "";

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  let geoNearStage;
  try {
    geoNearStage = rbacPolicy.tournament.geoQuery(user);
  } catch (error: any) {
    throw new Error(error.message);
  }

  const matchQuery: any = {
    isAccepted: false,
    isReject: false,
  };

  if (search) {
    matchQuery.$or = [
      { userName: { $regex: search, $options: "i" } },
      { cityToPlay: { $regex: search, $options: "i" } },
      { golfCourse: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    geoNearStage,
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const results = await LookingToPlay.aggregate(pipeline);

  const data = results.map((item) => ({
    ...item,
    distanceInKm: item.distance ? Number((item.distance / 1000).toFixed(2)) : 0,
  }));

  const countPipeline: any[] = [
    geoNearStage,
    { $match: matchQuery },
    { $count: "total" },
  ];

  const totalResult = await LookingToPlay.aggregate(countPipeline);
  const total = totalResult[0]?.total || 0;

  return {
    meta: {
      totalResult: total,
      currentPage: page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    results: data,
  };
};

const updateLookingToPlay = async (userId: string, id: string, data: any) => {
  const existing = await LookingToPlay.findById(id);

  if (!existing) {
    throw new Error("LookingToPlay not found");
  }

  if (existing.createdBy.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  const updateData: any = {};

  if (data.category) updateData.category = data.category;
  if (data.golfCourse) updateData.golfCourse = data.golfCourse;
  if (data.cityToPlay) updateData.cityToPlay = data.cityToPlay;

  if (data.fromDate) updateData.fromDate = new Date(data.fromDate);
  if (data.toDate) updateData.toDate = new Date(data.toDate);

  if (data.latitude && data.longitude) {
    updateData.visitingFrom = {
      type: "Point",
      coordinates: [data.longitude, data.latitude],
    };
  }

  return await LookingToPlay.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

const deleteLookingToPlay = async (userId: string, id: string) => {
  const existing = await LookingToPlay.findById(id);

  if (!existing) {
    throw new Error("LookingToPlay not found");
  }

  if (existing.createdBy.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }

  await LookingToPlay.findByIdAndDelete(id);

  return true;
};

const getLookingToPlayById = async (
  lookingToPlayId: string,
  userId: string,
) => {
  const lookingToPlay = await LookingToPlay.findById(lookingToPlayId)
    .select("-__v")
    .lean();

  if (!lookingToPlay) {
    throw new Error("LookingToPlay not found");
  }

  const tournament =
    (await Tournament.find({
      tournamentCreator: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .select(
        "tournamentName tournamentType typeName time date courseName tournamentImage",
      )
      .lean()) || [];

  return { lookingToPlay, tournament };
};

const sendInviteToPlay = async (
  payload: { lookingToPlayId: string; tournamentId: string },
  userId: string,
) => {
  const { lookingToPlayId, tournamentId } = payload;

  if (!lookingToPlayId) {
    throw new Error("lookingToPlayId is required");
  }

  if (!tournamentId) {
    throw new Error("tournamentId is required");
  }

  // Validate ObjectIds
  if (
    !Types.ObjectId.isValid(lookingToPlayId) ||
    !Types.ObjectId.isValid(tournamentId)
  ) {
    throw new Error("Invalid IDs provided");
  }

  const [lookingToPlay, tournament] = await Promise.all([
    LookingToPlay.findById(lookingToPlayId),
    Tournament.findById(tournamentId),
  ]);

  if (!lookingToPlay) {
    throw new Error("LookingToPlay not found");
  }

  if (!tournament) {
    throw new Error("Tournament not found");
  }

  //  Prevent self-invite
  if (lookingToPlay.createdBy.toString() === userId.toString()) {
    throw new Error("You cannot invite yourself");
  }

  //  Proper duplicate check (ONLY core fields)
  const existingInvite = await Invitation.findOne({
    sender: userId,
    receiver: lookingToPlay.createdBy,
    tournament: tournamentId,
  });

  if (existingInvite) {
    // Optional: allow resend if rejected
    // if (existingInvite.status === "rejected") {
    //   existingInvite.status = "pending";
    //   await existingInvite.save();
    //   return existingInvite;
    // }

    throw new Error("Invitation already sent");
  }

  // Clean data (remove tournamentType unless schema supports it)
  const invite = await Invitation.create({
    sender: userId,
    receiver: lookingToPlay.createdBy,
    tournament: tournamentId,
  });

  //  Notification (correct format)
  await sendNotification({
    sender: userId,
    receiver: lookingToPlay.createdBy,
    tournamentId: tournament._id,
    title: "Tournament Invitation Received",
    body: `You have received an invitation to play in "${tournament.tournamentName}"`,
    type: "tournament",
    linkId: `/tournament/${tournament._id}`,
    metadata: {
      invitationId: invite._id,
    },
  });

  return invite;
};

export const LookingToPlayService = {
  lookingToPlayCreate,
  showAllLookingToPlay,
  updateLookingToPlay,
  deleteLookingToPlay,
  getLookingToPlayById,
  sendInviteToPlay,
};
