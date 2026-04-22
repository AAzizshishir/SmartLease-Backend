// src/module/user/user.route.ts
import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import { upload } from "../../config/multer.config";

const router = Router();

// -------- Logged in user — any role -------- //
router.get(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  userController.getMe,
);

router.patch(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  upload.single("image"),
  userController.updateMe,
);

router.delete(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  userController.deleteMe,
);

// ---- Admin only ----//
router.get("/", authMiddleware(Role.ADMIN), userController.getAllUsers);

router.get("/:id", authMiddleware(Role.ADMIN), userController.getUserById);

// Update Status
router.patch(
  "/:id",
  authMiddleware(Role.ADMIN),
  userController.updateUserStatus,
);

router.delete(
  "/:id",
  authMiddleware(Role.ADMIN),
  userController.adminDeleteUser,
);

export const userRoutes = router;
