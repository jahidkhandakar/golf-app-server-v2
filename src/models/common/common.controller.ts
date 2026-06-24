import catchAsync from "./../../utils/catchAsync";
import sendResponse from "./../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CommonService } from "./common.service";

// about us
const createAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await CommonService.createAboutInDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "About created successfully.",
    data: result,
  });
});

const getAbout = catchAsync(async (req: Request, res: Response) => {
  const result = await CommonService.getAboutFromDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "About retrieved successfully.",
    data: result,
  });
});

const updateAbout = catchAsync(async (req: Request, res: Response) => {
  const aboutId = req.params.id;

  const result = await CommonService.updateAboutInDB(
    req.body,
    aboutId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "About updated successfully.",
    data: result,
  });
});

// terms and conditions
const createTermsInDB = catchAsync(async (req: Request, res: Response) => {
  const result = await CommonService.createTermsInDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Terms created successfully.",
    data: result,
  });
});

const getTermsFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await CommonService.getTermsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Terms retrieved successfully.",
    data: result,
  });
});

const updateTermsInDB = catchAsync(async (req: Request, res: Response) => {
  const termsId = req.params.id;

  const result = await CommonService.updateTermsInDB(
    req.body,
    termsId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Terms updated successfully.",
    data: result,
  });
});

// privacy policy
const createPrivacyPolicyInDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CommonService.createPrivacyPolicyInDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Privacy policy created successfully.",
      data: result,
    });
  },
);

const getPrivacyPolicyFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CommonService.getPrivacyPolicyFromDB();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Privacy policy retrieved successfully.",
      data: result,
    });
  },
);

const updatePrivacyPolicyInDB = catchAsync(
  async (req: Request, res: Response) => {
    const privacyPolicyId = req.params.id;

    const result = await CommonService.updatePrivacyPolicyInDB(
      req.body,
      privacyPolicyId as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Terms updated successfully.",
      data: result,
    });
  },
);

const getSupport = catchAsync(async (req: Request, res: Response) => {
  const result = await CommonService.getSupport();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Support retrieved successfully.",
    data: result,
  });
});

const createOrUpdateSupport = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CommonService.createOrUpdateSupport(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Support updated successfully.",
      data: result,
    });
  },
);

export const CommonController = {
  // about us
  createAbout,
  getAbout,
  updateAbout,
  // terms and conditions
  createTermsInDB,
  getTermsFromDB,
  updateTermsInDB,
  // privacy policy
  createPrivacyPolicyInDB,
  getPrivacyPolicyFromDB,
  updatePrivacyPolicyInDB,
  // support
  getSupport,
  createOrUpdateSupport,
};
