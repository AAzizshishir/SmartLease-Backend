import { StatusCodes } from "http-status-codes";
import { envVariables } from "../config/env";
import { Role, UserStatus } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import AppError from "../utils/AppError";

async function seedAdmin() {
  try {
    const adminData = {
      name: envVariables.ADMIN_NAME,
      email: envVariables.ADMIN_EMAIL,
      role: "ADMIN",
      password: envVariables.ADMIN_PASSWORD,
      status: UserStatus.ACTIVE,
    };

    const existingUser = await prisma.user.findUnique({
      where: {
        email: adminData.email,
      },
    });

    if (existingUser) {
      throw new AppError(StatusCodes.CONFLICT, "User already exists!!");
    }

    const signUpAdmin = await fetch(
      "http://localhost:5000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          origin: envVariables.APP_URL || "http://localhost:3000",
        },
        body: JSON.stringify(adminData),
      },
    );
    // Debug
    const responseData = await signUpAdmin.json();
    console.log("Response status:", signUpAdmin.status);
    console.log("Response body:", responseData);

    if (signUpAdmin.ok) {
      await prisma.user.update({
        where: {
          email: adminData.email,
        },
        data: {
          emailVerified: true,
        },
      });
      console.log("Admin Seeded Successfull");
    }
  } catch (error) {
    console.error(error);
  }
}

seedAdmin();
