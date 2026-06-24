import { Types } from "mongoose";
import QueryBuilder from "../../shared/queryBuilder";
import { IInvitation } from "./invitation.interface";
import { Invitation } from "./invitation.model";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { sendNotification } from "../../notifications/notification.service";
import { RequestToPlay } from "../request-to-play/request.to.play.model";
import { ClubUser } from "../club-users/club.users.model";
import { ClubTournament } from "../club-tournament/club.tournament.model";
import { Tournament } from "../tournament/tournament.model";

const getMyInvitations = async (query: any, userId: string) => {
  const filter = {
    receiver: new Types.ObjectId(userId),
    status: "pending",
    ...query,
  };

  if (query.status) {
    filter.status = query.status;
  }

  const invitationQuery = new QueryBuilder<IInvitation>(
    Invitation.find(),
    filter,
  )
    .search(["name", "email", "role", "status"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await invitationQuery.modelQuery
    .populate("sender", "name email image")
    .populate("tournament", "tournamentName courseName city")
    .select("-isDeleted -__v")
    .lean();

  const meta = await invitationQuery.countTotal();

  return {
    meta,
    results,
  };
};

const acceptInvitation = async (userId: string, invitationId: string) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation)
    throw new AppError(StatusCodes.NOT_FOUND, "Invitation not found");

  if (
    !invitation.receiver ||
    invitation.receiver.toString() !== userId.toString()
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to accept this invitation",
    );
  }

  if (invitation.status !== "pending") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invitation already processed");
  }

  invitation.status = "accepted";

  await invitation.save();
  //  const tournament = await Tournament.findById(invitation.tournament._id);
  if (!invitation.tournament) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Tournament ID is missing from the invitation",
    );
  }

  if (!invitation.sender) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Sender ID is missing from the invitation",
    );
  }

  const senderId = invitation.sender;

  const tournament = await Tournament.findById(invitation.tournament);

  if (!tournament) {
    throw new AppError(StatusCodes.NOT_FOUND, "Tournament not found");
  }

  // capacity check
  if (tournament.tournamentPlayersList.length >= tournament.numberOfPlayers) {
    return {
      message: "Tournament is already full, cannot join the tournament",
    };
  }

  // safe ObjectId compare
  const isAlreadyInTournament = tournament.tournamentPlayersList.some(
    (id: Types.ObjectId) => id.toString() === senderId.toString(),
  );

  if (isAlreadyInTournament) {
    return {
      message:
        "The player is already part of the tournament, cannot join again.",
    };
  }

  // Add user to tournamentPlayersList
  tournament.tournamentPlayersList.push(senderId);
  //  tournament.tournamentPlayersList.push(invitation.sender);

  await tournament.save();

  //  find club and join requested player on this
  const findClub = await ClubTournament.findOne({
    tournament: tournament._id,
  });

  const findReqJoinToClub = await ClubUser.findOne({
    club: findClub?._id,
    user: senderId,
    // user: invitation.sender,
  });

  if (!findReqJoinToClub) {
    await ClubUser.create({
      club: findClub?._id,
      user: senderId,
      // user: invitation.sender,
      status: "accepted",
    });
  }

  await RequestToPlay.create({
    requestedUser: senderId,
    // requestedUser: invitation.sender,
    tournamentcreator: userId,
    tournament: tournament._id,
    tournamentType: tournament.typeName,
    requestType: "open",
    status: "accepted",
  });

  // notify tournament creator
  await sendNotification({
    sender: senderId,
    // sender: invitation.sender,
    receiver: userId,
    tournamentId: tournament._id,
    isRequest: true,
    title: "Invitation Accepted",
    body: `Your request to play in "${tournament.tournamentName}" has been accepted.`,
    type: "tournament",
    linkId: `/tournament/${tournament._id}/requested`,
  });

  // notify sender
  await sendNotification({
    sender: userId,
    //  receiver: invitation.sender,
    receiver: senderId,
    title: "Invitation Accepted",
    body: `Your request to play in "${tournament.tournamentName}" has been accepted.`,
    type: "tournament",
    linkId: `/tournament/${tournament._id}/requested`,
  });

  return invitation;
};

const rejectInvitation = async (userId: string, invitationId: string) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation)
    throw new AppError(StatusCodes.NOT_FOUND, "Invitation not found");

  if (
    !invitation.receiver ||
    invitation.receiver.toString() !== userId.toString()
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to reject this invitation",
    );
  }

  if (invitation.status !== "pending") {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invitation already processed");
  }

  invitation.status = "rejected";
  await invitation.save();

  // notify sender
  await sendNotification({
    sender: userId,
    receiver: invitation.sender,
    title: "Invitation Rejected",
    body: "Your tournament invitation has been rejected.",
    type: "tournament",
    linkId: `/tournament/${invitation.tournament}`,
  });

  return invitation;
};

export const InvitationService = {
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
};
