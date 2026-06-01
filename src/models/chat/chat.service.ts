import { ChatRoom } from "./chat.model";

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
        path: "btournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
      {
        path: "stournamentId",
        select: "tournamentName  tournamentCreator tournamentImage",
      },
    ])
    .select("_id participants chatCreator btournamentId type isPinned");
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

  // If a chat already exists, return a 200 response without creating a new chat
  if (existingChat) {
    return {
      status: 200,
      existingChat,
    };
  }

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
        path: "btournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
      {
        path: "stournamentId",
        select: "tournamentName  tournamentCreator tournamentImage",
      },
    ])
    .select("_id participants chatCreator btournamentId type isPinned");
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
  const isBigTournament = data.type === "big";
  const tournamentId = data.tournamentid;

  // Get tournament by type
  const tournament = isBigTournament
    ? await Tournament.findById(tournamentId)
    : await SmallTournament.findById(tournamentId);

  if (!tournament) {
    throw new Error("Tournament not found.");
  }

  // Check if chat already exists for the tournament
  const existingChat = isBigTournament
    ? await ChatRoom.findOne({ btournamentId: tournamentId })
    : await ChatRoom.findOne({ stournamentId: tournamentId });

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
    .map((p: string) => p.toString())
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
          path: "btournamentId",
          select: "tournamentName clubName tournamentCreator  tournamentImage",
        },
        {
          path: "stournamentId",
          select: "tournamentName  tournamentCreator tournamentImage",
        },
      ])
      .select("_id participants chatCreator btournamentId type isPinned");
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
    type: "group",
  };

  if (isBigTournament) {
    chatData.btournamentId = tournamentId;
  } else {
    chatData.stournamentId = tournamentId;
  }

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
        path: "btournamentId",
        select: "tournamentName clubName tournamentCreator  tournamentImage",
      },
      {
        path: "stournamentId",
        select: "tournamentName  tournamentCreator tournamentImage",
      },
    ])
    .select("_id participants chatCreator btournamentId type isPinned");

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
      "btournamentId",
      "tournamentName clubName tournamentCreator  tournamentImage",
    )
    .populate(
      "stournamentId",
      "tournamentName  tournamentCreator tournamentImage",
    )
    .select("_id participants chatCreator btournamentId type isPinned")
    .sort({ isPinned: -1, updatedAt: -1 }) // Sort by pinned first, then by latest update

    .exec();
  return result;
};

export const ChatService = {
  createsingleChat,
  createGroupChat,
  showMyChat,
};
