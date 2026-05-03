import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EventService } from "./event.service";
import { StatusCodes } from "http-status-codes";
import { uploadToS3 } from "./../../middlewares/fileUploadHandler";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const eventData = { ...req.body };

  const files = req.files as { image?: Express.Multer.File[] };
  if (files?.image?.[0]) {
    eventData.image = await uploadToS3(files.image[0]);
  } else if (!eventData.image) {
    // default placeholder if not provided
    eventData.image = "https://placehold.co/600x400?text=Event+Image";
  }

  const result = await EventService.createEvent(eventData);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Event created successfully",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getAllEvents(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Events retrieved successfully",
    data: result,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.getSingleEvent(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Event fetched successfully",
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const eventData = { ...req.body };

  const files = req.files as { image?: Express.Multer.File[] };
  if (files?.image?.[0]) {
    eventData.image = await uploadToS3(files.image[0]);
  }

  const result = await EventService.updateEvent(id as string, eventData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Event updated successfully",
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.deleteEvent(id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Event deleted successfully",
    data: result,
  });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  updateEvent,
  deleteEvent,
};
