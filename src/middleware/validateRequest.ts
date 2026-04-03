// src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import z, { ZodError } from "zod";

const validateRequest = (zodSchema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      const parseResult = zodSchema.safeParse(req.body);

      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      req.body = parseResult.data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      next(error);
    }
  };
};

export default validateRequest;
