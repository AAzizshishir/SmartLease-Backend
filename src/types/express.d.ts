import { Role, UserStatus } from "../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        emailVerified: boolean;
      };
    }
  }
}
