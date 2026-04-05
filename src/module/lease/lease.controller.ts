import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { leaseService } from "./lease.service";
import { Request, Response } from "express";

const createLease = catchAsync(async (req: Request, res: Response) => {
  const lease = await leaseService.createLease(
    req.params.application_id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Lease created successfully",
    data: lease,
  });
});

const getMyLease = catchAsync(async (req: Request, res: Response) => {
  const lease = await leaseService.getMyLease(req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Lease fetched successfully",
    data: lease,
  });
});

const confirmLease = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseService.confirmLease(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const getLandlordLeases = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseService.getLandlordLeases(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Leases fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const terminateLease = catchAsync(async (req: Request, res: Response) => {
  const result = await leaseService.terminateLease(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const leaseController = {
  createLease,
  getMyLease,
  confirmLease,
  getLandlordLeases,
  terminateLease,
};
