import { Request, Response } from "express";
import { JwtUserPayload } from "../../middlewares/auth";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { DiscountService } from "./discount.service";
import { AdminAuditLog } from "../admin-audit/admin.audit.model";
import { getAdmin } from "../../middlewares/adminAuth";

// User id for user-facing actions (redeem/earn), admin id for billing controls.
const uid = (req: Request) => (req.user as JwtUserPayload).id as string;
const adminId = (req: Request) => getAdmin(req).adminId;

// ── Admin: mint / import / manage ────────────────────────────────────────
const mintComp = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.mintComp(adminId(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Comp code minted.",
    data: result,
  });
});

const mintCampaign = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.mintCampaign(adminId(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Campaign code created.",
    data: result,
  });
});

const importStoreCode = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.importStoreCode(adminId(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Store code imported.",
    data: result,
  });
});

const grantComp = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.grantComp(
    adminId(req),
    req.body.userId,
    Number(req.body.months),
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Comp entitlement granted.",
    data: result,
  });
});

const revokeCode = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.revokeCode(
    adminId(req),
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Code revoked.",
    data: result,
  });
});

const listCodes = catchAsync(async (_req: Request, res: Response) => {
  const result = await DiscountService.listCodes();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Discount dashboard retrieved.",
    data: result,
  });
});

const listAudit = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminAuditLog.find()
    .populate("actingAdmin", "name email")
    .sort({ createdAt: -1 })
    .limit(500);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Audit log retrieved.",
    data: result,
  });
});

// ── User-facing ──────────────────────────────────────────────────────────
const redeem = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.redeem(uid(req), req.body.code);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Code applied.",
    data: result,
  });
});

const earn = catchAsync(async (req: Request, res: Response) => {
  const result = await DiscountService.issueEarned(uid(req), req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Earned reward applied to your account.",
    data: result,
  });
});

export const DiscountController = {
  mintComp,
  mintCampaign,
  importStoreCode,
  grantComp,
  revokeCode,
  listCodes,
  listAudit,
  redeem,
  earn,
};
