import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { CountryCapService } from "./country.cap.service";

const getAll = catchAsync(async (_req: Request, res: Response) => {
  const result = await CountryCapService.getAll();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country caps retrieved.",
    data: result,
  });
});

const upsertCap = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryCapService.upsertCap(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country cap saved.",
    data: result,
  });
});

const deleteCap = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryCapService.deleteCap(
    req.params.countryCode as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Country cap deleted.",
    data: result,
  });
});

export const CountryCapController = {
  getAll,
  upsertCap,
  deleteCap,
};
