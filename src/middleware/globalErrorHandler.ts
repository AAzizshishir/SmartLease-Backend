// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // আমাদের নিজের error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  // Prisma unique constraint error
  if ((err as any).code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry",
      data: null,
    });
  }

  // unexpected error
  console.error(err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: null,
  });
};
