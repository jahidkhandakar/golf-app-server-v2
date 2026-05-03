import { Event } from "./event.model";
import AppError from "./../../errors/AppError";
import { StatusCodes } from "http-status-codes";

const createEvent = async (payload: any) => {
  const result = await Event.create(payload);
  return result;
};

const getAllEvents = async (query: any) => {
  const { categoryId, isPremium, search, limit = 10, page = 1 } = query;
  const filter: any = {};

  if (categoryId) filter.categoryId = categoryId;
  if (isPremium !== undefined) filter.isPremium = isPremium === "true";
  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const events = await Event.find(filter)
    .populate("categoryId")
    .skip(skip)
    .limit(Number(limit))
    .sort({ date: 1 })
    .lean();

  const total = await Event.countDocuments(filter);

  return {
    meta: {
      totalResult: total,
      currentPage: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
    results: events,
  };
};

const getSingleEvent = async (id: string) => {
  const result = await Event.findById(id).populate("categoryId").lean();
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Event not found");
  }
  return result;
};

const updateEvent = async (id: string, payload: any) => {
  const result = await Event.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Event not found");
  }
  return result;
};

const deleteEvent = async (id: string) => {
  const result = await Event.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Event not found");
  }
  return result;
};

export const EventService = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
};
