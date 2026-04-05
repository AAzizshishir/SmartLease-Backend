// src/module/user/user.route.ts
import { Router } from "express";
import { userController } from "./user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import validateRequest from "../../middleware/validateRequest";
import { Role } from "../../generated/prisma/enums";
import { updateUserSchema } from "./user.validate";

const router = Router();

// ─── Logged in user — যেকোনো role ───────────────
router.get(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  userController.getMe,
);

router.patch(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  validateRequest(updateUserSchema),
  userController.updateMe,
);

// router.patch(
//   "/me/avatar",
//   authMiddleware(),
//   upload.single("image"),
//   userController.updateAvatar
// );

router.delete(
  "/me",
  authMiddleware(Role.ADMIN, Role.LANDLORD, Role.TENANT),
  userController.deleteMe,
);

// ---- Admin only ----//
router.get("/", authMiddleware(Role.ADMIN), userController.getAllUsers);

router.get("/:id", authMiddleware(Role.ADMIN), userController.getUserById);

router.patch(
  "/:id/block",
  authMiddleware(Role.ADMIN),
  userController.blockUser,
);

router.patch(
  "/:id/unblock",
  authMiddleware(Role.ADMIN),
  userController.unblockUser,
);

router.delete(
  "/:id",
  authMiddleware(Role.ADMIN),
  userController.adminDeleteUser,
);

export const userRoutes = router;
