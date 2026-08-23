import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { IndoorService } from "./indoor.service";
import { SimSessionService } from "./sim.session.service";

const uid = (req: Request) => (req.user as JwtUserPayload).id as string;

// ── Leagues ─────────────────────────────────────────────────────────────
const createLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.createLeague(uid(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Indoor league created.",
    data: result,
  });
});

const listLeagues = catchAsync(async (_req: Request, res: Response) => {
  const result = await IndoorService.listLeagues();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Indoor leagues retrieved.",
    data: result,
  });
});

const getLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.getLeague(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Indoor league retrieved.",
    data: result,
  });
});

const submitRound = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.submitRound(
    req.params.id as string,
    uid(req),
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Round submitted.",
    data: result,
  });
});

const verifyWitness = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.verifyWitness(
    req.params.roundId as string,
    Boolean(req.body.passed),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Witness result recorded.",
    data: result,
  });
});

const creatorOverride = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.creatorOverride(
    req.params.id as string,
    req.params.roundId as string,
    uid(req),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Round overridden.",
    data: result,
  });
});

const setFlights = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.setFlights(
    req.params.id as string,
    uid(req),
    req.body.allocations ?? [],
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Flights updated.",
    data: result,
  });
});

const getStandings = catchAsync(async (req: Request, res: Response) => {
  const result = await IndoorService.getStandings(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Standings computed.",
    data: result,
  });
});

// ── Sim sessions (sim board / Sim Social Rounds) ─────────────────────────
const createSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SimSessionService.createSession(uid(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Sim session created.",
    data: result,
  });
});

const getSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SimSessionService.getSession(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sim session retrieved.",
    data: result,
  });
});

const listSessions = catchAsync(async (req: Request, res: Response) => {
  const result = await SimSessionService.listSessions(
    req.query.league as string | undefined,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sim sessions retrieved.",
    data: result,
  });
});

const assignBay = catchAsync(async (req: Request, res: Response) => {
  const result = await SimSessionService.assignBay(
    req.params.id as string,
    uid(req),
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bay assignment updated.",
    data: result,
  });
});

const recordCheck = catchAsync(async (req: Request, res: Response) => {
  const result = await SimSessionService.recordCheck(
    req.params.id as string,
    uid(req),
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Proximity check recorded.",
    data: result,
  });
});

export const IndoorController = {
  createLeague,
  listLeagues,
  getLeague,
  submitRound,
  verifyWitness,
  creatorOverride,
  setFlights,
  getStandings,
  createSession,
  getSession,
  listSessions,
  assignBay,
  recordCheck,
};
