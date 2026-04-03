import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "../generated/prisma/enums";
import AppError from "../utils/AppError";
import { StatusCodes } from "http-status-codes";
import { auth as betterAuth } from "../lib/auth";

export const authMiddleware = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Better Auth দিয়ে session validate করো
      // এটাই যথেষ্ট — DB check আলাদা করে দরকার নেই
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });

      // 2. Session নেই
      if (!session?.user) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "Unauthorized. Please login again",
        );
      }

      const user = session.user;

      // 3. User blocked কিনা check
      if (user.status === UserStatus.BLOCKED) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "Your account has been blocked. Contact support",
        );
      }

      // 4. Soft delete check
      if (!user) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          "This account no longer exists",
        );
      }

      // 5. Role check
      if (roles.length > 0 && !roles.includes(user.role as Role)) {
        throw new AppError(
          StatusCodes.FORBIDDEN,
          "You do not have permission to access this resource",
        );
      }

      // 6. req.user attach করো
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        status: user.status as UserStatus,
        emailVerified: user.emailVerified,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
