import { Ticket } from "./ticket.model";
import { Event } from "../event/event.model";
import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

const purchaseTicket = async (userId: string, payload: { eventId: string, quantity: number }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await Event.findById(payload.eventId).session(session);

    if (!event) {
      throw new AppError(StatusCodes.NOT_FOUND, "Event not found");
    }

    if (!event.isPremium) {
      throw new AppError(StatusCodes.BAD_REQUEST, "This is a free event, no ticket is required.");
    }

    if (event.soldTickets + payload.quantity > event.totalTickets) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Not enough tickets available");
    }

    const ticketId = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const totalPrice = (event.price || 0) * payload.quantity;

    const ticket = await Ticket.create(
      [
        {
          userId,
          eventId: payload.eventId,
          quantity: payload.quantity,
          totalPrice,
          ticketId,
          status: "active",
        },
      ],
      { session }
    );

    event.soldTickets += payload.quantity;
    await event.save({ session });

    await session.commitTransaction();
    return ticket[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getMyTickets = async (userId: string) => {
  const tickets = await Ticket.find({ userId })
    .populate({
      path: "eventId",
      select: "title date location image",
    })
    .sort({ createdAt: -1 })
    .lean();
  return tickets;
};

const getAllTickets = async (query: any) => {
  const { page = 1, limit = 10, search } = query;
  const filter: any = {};
  
  if (search) {
    filter.ticketId = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const tickets = await Ticket.find(filter)
    .populate("userId", "fullName email")
    .populate("eventId", "title")
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 })
    .lean();

  const total = await Ticket.countDocuments(filter);

  return {
    meta: {
      totalResult: total,
      currentPage: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
    results: tickets,
  };
};

export const TicketService = {
  purchaseTicket,
  getMyTickets,
  getAllTickets,
};
