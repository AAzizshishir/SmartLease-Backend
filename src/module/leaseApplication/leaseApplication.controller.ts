import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { leaseApplicationService } from "./leaseApplication.service";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const applyForUnit = catchAsync(async (req: Request, res: Response) => {
  const application = await leaseApplicationService.applyForUnit(
    req.user!.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Application submitted successfully",
    data: application,
  });
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseApplicationService.getMyApplications(
    req.user!.id,
    req.query as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Applications fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const cancelApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseApplicationService.cancelApplication(
    req.params.id as string,
    req.user!.id,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Application cancelled successfully",
    data: result,
  });
});

const getUnitApplications = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseApplicationService.getUnitApplications(
    req.params.unit_id as string,
    req.user!.id,
    req.query as any,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Applications fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const approveApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseApplicationService.approveApplication(
    req.params.id as string,
    req.user!.id,
  );
  console.log("from controller", result);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const rejectApplication = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseApplicationService.rejectApplication(
    req.params.id as string,
    req.user!.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Application rejected successfully",
    data: result,
  });
});

export const leaseApplicationController = {
  applyForUnit,
  getMyApplications,
  cancelApplication,
  getUnitApplications,
  approveApplication,
  rejectApplication,
};
