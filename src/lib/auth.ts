import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../generated/prisma/enums";
import { envVariables } from "../config/env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "https://smartlease-frontend.onrender.com",
    "https://smartlease-frontend.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        default: Role.TENANT,
      },
      status: {
        type: "string",
        required: false,
        default: UserStatus.ACTIVE,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      path: "/",
      domain: "smartlease-backend.onrender.com",
    },
  },
  cookies: {
    sessionToken: {
      attributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
        path: "/",
      },
    },
    sessionData: {
      attributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
        path: "/",
      },
    },
  },
});
