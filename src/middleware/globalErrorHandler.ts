// middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import { Prisma } from "../generated/prisma/client";
import { envVariables } from "../config/env";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  // 2. Prisma validation error — wrong field, wrong type
  // QueryBuilder error comes here
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: "Invalid query. Check your request fields and types",
      ...(envVariables.NODE_ENV === "development" && {
        details: err.message,
      }),
      data: null,
    });
  }

  // 3. Prisma known request error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // unique constraint
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[])?.join(", ");
      return res.status(409).json({
        success: false,
        message: `${fields} already exists`,
        data: null,
      });
    }

    // record not found
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
        data: null,
      });
    }

    // foreign key constraint
    if (err.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Related record not found",
        data: null,
      });
    }

    if (envVariables.NODE_ENV === "development") {
      return res.status(400).json({
        success: false,
        message: `Prisma error: ${err.code}`,
        details: err.message,
        meta: err.meta,
        data: null,
      });
    }
  }

  // 4. Zod validation error — already validateRequest middleware-এ handle হয়
  // কিন্তু কোথাও manually parse করলে এখানে আসবে
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: null,
    });
  }

  // 5. Unexpected error
  if (envVariables.NODE_ENV === "development") {
    console.error("Unexpected error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      stack: err.stack,
      data: null,
    });
  }

  // generic message in production
  console.error("Unexpected error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: null,
  });
};
