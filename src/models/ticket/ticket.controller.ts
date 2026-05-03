import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TicketService } from "./ticket.service";
import { StatusCodes } from "http-status-codes";
import { JwtUserPayload } from "./../../middlewares/auth";

const purchaseTicket = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TicketService.purchaseTicket(userId as string, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Ticket purchased successfully",
    data: result,
  });
});

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const { id: userId } = req.user as JwtUserPayload;
  const result = await TicketService.getMyTickets(userId as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Your tickets retrieved successfully",
    data: result,
  });
});

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await TicketService.getAllTickets(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All tickets retrieved successfully",
    data: result,
  });
});

export const TicketController = {
  purchaseTicket,
  getMyTickets,
  getAllTickets,
};
