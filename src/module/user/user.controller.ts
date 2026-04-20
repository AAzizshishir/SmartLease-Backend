// src/module/user/user.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { userService } from "./user.service";
import { IQueryParams } from "../../interface/query.interface";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// ─── Logged in user ───────────────────────────────

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getMe(req.user!.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.updateMe(req.user!.id, req.body, req.file);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const deleteMe = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteMe(req.user!.id);

  // session clear
  res.clearCookie("better-auth.session_token");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Account deleted successfully",
    data: null,
  });
});

// ─── Admin only ───────────────────────────────────

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query as IQueryParams);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
  const { id } = req.params;
  const { status } = req.body;
  const user = await userService.updateUserStatus(id as string, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User Update successfully",
    data: user,
  });
});

const adminDeleteUser = catchAsync(async (req: Request, res: Response) => {
  await userService.adminDeleteUser(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: null,
  });
});

export const userController = {
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  getUserById,
  updateUserStatus,
  adminDeleteUser,
};
