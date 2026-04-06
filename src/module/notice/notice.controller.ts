import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { noticeService } from "./notice.service";
import { sendResponse } from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

// Landlord
const createNotice = catchAsync(async (req: Request, res: Response) => {
  const notice = await noticeService.createNotice(req.user!.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Notice created successfully",
    data: notice,
  });
});

const getLandlordNotices = catchAsync(async (req: Request, res: Response) => {
  const result = await noticeService.getLandlordNotices(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notices fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getLandlordNoticeById = catchAsync(
  async (req: Request, res: Response) => {
    const notice = await noticeService.getLandlordNoticeById(
      req.params.id as string,
      req.user!.id,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Notice fetched successfully",
      data: notice,
    });
  },
);

const updateNotice = catchAsync(async (req: Request, res: Response) => {
  const notice = await noticeService.updateNotice(
    req.params.id as string,
    req.user!.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice updated successfully",
    data: notice,
  });
});

const deleteNotice = catchAsync(async (req: Request, res: Response) => {
  await noticeService.deleteNotice(req.params.id as string, req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice deleted successfully",
    data: null,
  });
});

// Tenant
const getMyNotices = catchAsync(async (req: Request, res: Response) => {
  const result = await noticeService.getMyNotices(
    req.user!.id,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notices fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getNoticeById = catchAsync(async (req: Request, res: Response) => {
  const notice = await noticeService.getNoticeById(
    req.params.id as string,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice fetched successfully",
    data: notice,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await noticeService.markAsRead(
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

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const result = await noticeService.getUnreadCount(req.user!.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unread count fetched successfully",
    data: result,
  });
});

export const noticeController = {
  createNotice,
  getLandlordNotices,
  getLandlordNoticeById,
  updateNotice,
  deleteNotice,
  getMyNotices,
  getNoticeById,
  markAsRead,
  getUnreadCount,
};
