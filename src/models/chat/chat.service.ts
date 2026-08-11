import { Message } from "../message/message.model";
import { Tournament } from "../tournament/tournament.model";
import { ChatRoom } from "./chat.model";
import { assertCanStartConversation } from "../../shared/messagingZone";

const createsingleChat = async (creator: string, data: any) => {
  // Add the creator to the participants array (if not already added)
  if (!data.participants.includes(creator.toString())) {
    data.participants.push(creator);
  }

  // Check if a chat already exists with the same participants
  const existingChat = await ChatRoom.findOne({
    participants: { $all: data.participants },
    type: "single",
  })
    .populate({
      path: "lastMessage",
      select: "message media timestamp",
      populate: {
        path: "sender",
        select: "name", // Only fetch sender's name
      },
    })
    .populate([
      { path: "participants", select: "name image" },
      {
        path: "tournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
    ])
    .select("_id participants chatCreator tournamentId type isPinned");
  // .populate({
  //     path: "lastMessage",
  //     select: "message media timestamp",
  //     populate: {
  //         path: "sender",
  //         select: "name", // Only fetch sender's name
  //     },

  // }).populate([
  //     {
  //         path: 'participants',
  //         select: 'name image'
  //     }

  // ]);

  // If a chat already exists, return a 200 response without creating a new chat.
  // Existing conversations stay open for both sides regardless of location.
  if (existingChat) {
    return {
      status: 200,
      existingChat,
    };
  }

  // Starting a NEW conversation is gated by the messaging-zone rule (spec §11):
  // free users only in their home zone or on a travel trial.
  await assertCanStartConversation(creator);

  // Proceed with creating the new chat if no existing chat is found
  const datas = {
    ...data,
    chatCreator: creator,
  };

  const result = await ChatRoom.create(datas);

  // Optionally create an initial message
  const initialMessage = new Message({
    chatRoomId: result._id,
    sender: creator,
    message: result.type === "group" ? "Welcome to the group!" : "Hello!",
  });

  await initialMessage.save();

  // Update the chat room with the last message reference
  result.lastMessage = initialMessage._id;
  await result.save();

  // Populate participants and chatCreator before returning
  // Populate participants (only name and image) and chatCreator (only name and image)
  const populatedResult = await ChatRoom.findById(result._id)
    .populate({
      path: "lastMessage",
      select: "message media timestamp",
      populate: {
        path: "sender",
        select: "name", // Only fetch sender's name
      },
    })
    .populate([
      { path: "participants", select: "name image" },
      {
        path: "tournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
    ])
    .select("_id participants chatCreator tournamentId type isPinned");
  // .populate({
  //     path: "lastMessage",
  //     select: "message media timestamp",
  //     populate: {
  //         path: "sender",
  //         select: "name", // Only fetch sender's name
  //     },

  // })
  // .populate([
  //     {
  //         path: 'participants',
  //         select: 'name image'
  //     },

  // ]);

  return {
    status: 201,
    result: populatedResult,
  };
};

// create the group message

const createGroupChat = async (userId: string, data: any) => {
  const tournamentId = data.tournamentid;

  // Get tournament by type
  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  // Check if chat already exists for the tournament
  const existingChat = await ChatRoom.findOne({ tournamentId });

  // Prepare participant list
  const tournamentCreator = tournament.tournamentCreator?.toString();
  const newParticipants = (data.newParticipants || []).map((p: string) =>
    p.toString(),
  );

  // Remove duplicate creator in new participants
  const allParticipants = [
    tournamentCreator,
    ...newParticipants.filter((p: string) => p !== tournamentCreator),
  ];

  // Clean up players list
  const cleanedTournamentPlayersList = (tournament.tournamentPlayersList || [])
    .map((p: any) => p.toString())
    .filter((p: string) => p !== tournamentCreator);

  // Merge all and make them unique
  const participants = Array.from(
    new Set([...allParticipants, ...cleanedTournamentPlayersList]),
  );

  // If chat already exists, update and return it
  if (existingChat) {
    const currentParticipants = existingChat.participants.map((p) =>
      p.toString(),
    );
    const updatedParticipants = Array.from(
      new Set([...currentParticipants, ...participants]),
    );

    existingChat.participants = updatedParticipants;
    await existingChat.save();

    const populatedChat = await ChatRoom.findById(existingChat._id)
      .populate({
        path: "lastMessage",
        select: "message media timestamp",
        populate: {
          path: "sender",
          select: "name", // Only fetch sender's name
        },
      })
      .populate([
        { path: "participants", select: "name image" },
        {
          path: "tournamentId",
          select: "tournamentName clubName tournamentCreator  tournamentImage",
        },
      ])
      .select("_id participants chatCreator tournamentId type isPinned");
    // .populate({
    //     path: "lastMessage",
    //     select: "message media timestamp",
    //     populate: {
    //         path: "sender",
    //         select: "name", // Only fetch sender's name
    //     },

    // }).populate([
    //     { path: 'participants', select: 'name image' },
    //     {
    //         path: 'btournamentId',
    //         select: 'tournamentName clubName tournamentCreator  tournamentImage'
    //     },
    //     {
    //         path: 'stournamentId',
    //         select: 'tournamentName  tournamentCreator tournamentImage'
    //     },

    // ]);

    return {
      status: 200,
      chatRoom: populatedChat,
    };
  }

  // Create new chat room
  const chatData = {
    participants,
    chatCreator: tournamentCreator,
    type: "group" as const,
    tournamentId,
  };

  const newChat = await ChatRoom.create(chatData);

  // Create welcome message
  const welcomeMessage = new Message({
    chatRoomId: newChat._id,
    sender: userId,
    message: "Welcome to the group!",
  });

  await welcomeMessage.save();

  newChat.lastMessage = welcomeMessage._id;
  await newChat.save();

  const populatedNewChat = await ChatRoom.findById(newChat._id)
    .populate({
      path: "lastMessage",
      select: "message media timestamp",
      populate: {
        path: "sender",
        select: "name", // Only fetch sender's name
      },
    })
    .populate([
      { path: "participants", select: "name image" },
      {
        path: "tournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
    ])
    .select("_id participants chatCreator tournamentId type isPinned");

  return {
    status: 201,
    chatRoom: populatedNewChat,
  };
};

// show my chat
//----------------------------------------------------------
const showMyChat = async (userId: string) => {
  // Fetch the chat rooms where the user is a participant and exclude soft-deleted ones
  const result = await ChatRoom.find({ participants: userId, isDeleted: false })
    .populate({
      path: "lastMessage",
      select: "message media timestamp",
      populate: {
        path: "sender",
        select: "name", // Only fetch sender's name
      },
    })
    .populate("participants", "name image")
    .populate(
      "tournamentId",
      "tournamentName clubName tournamentCreator  tournamentImage",
    )
    .select("_id participants chatCreator tournamentId type isPinned")
    .sort({ isPinned: -1, updatedAt: -1 }) // Sort by pinned first, then by latest update

    .exec();
  return result;
};

export const ChatService = {
  createsingleChat,
  createGroupChat,
  showMyChat,
};
