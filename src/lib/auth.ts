import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Role, UserStatus } from "../generated/prisma/enums";
import { envVariables } from "../config/env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [envVariables.APP_URL!],
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
  // advanced: {
  //   cookiePrefix: "better-auth",
  //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  //   useSecureCookies: process.env.NODE_ENV === "production",
  //   crossSubDomainCookies: {
  //     enabled: false,
  //   },
  //   disableCSRFCheck: true, // Allow requests without Origin header (Postman, mobile apps, etc.)
  // },
  // cookies: {
  //   sessionToken: {
  //     attributes: {
  //       sameSite: "none",
  //       secure: "true",
  //       httpOnly: true,
  //       path: "/",
  //     },
  //   },
  //   sessionData: {
  //     attributes: {
  //       sameSite: "none",
  //       secure: "true",
  //       httpOnly: true,
  //       path: "/",
  //     },
  //   },
  // },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: false,
    },
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none", // ← এটা যোগ করো
      secure: true,
      httpOnly: true,
      path: "/",
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
