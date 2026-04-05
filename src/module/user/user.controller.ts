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
  const user = await userService.updateMe(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

// const updateAvatar = catchAsync(async (req: Request, res: Response) => {
//   const file = req.file;

//   if (!file) {
//     return sendResponse(res, {
//       statusCode: StatusCodes.BAD_REQUEST,
//       success: false,
//       message: "Image is required",
//       data: null,
//     });
//   }

//   const user = await userService.updateAvatar(req.user!.id, file);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Avatar updated successfully",
//     data: user,
//   });
// });

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

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.blockUser(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User blocked successfully",
    data: user,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.unblockUser(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User unblocked successfully",
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
  //   updateAvatar,
  deleteMe,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  adminDeleteUser,
};
