import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import { createNoticeSchema, updateNoticeSchema } from "./notice.validation";
import { noticeController } from "./notice.controller";

const router = Router();

// ---- Landlord ----
router.post(
  "/",
  authMiddleware(Role.LANDLORD),
  validateRequest(createNoticeSchema),
  noticeController.createNotice,
);

router.get(
  "/",
  authMiddleware(Role.LANDLORD),
  noticeController.getLandlordNotices,
);

router.get(
  "/landlord/:id",
  authMiddleware(Role.LANDLORD),
  noticeController.getLandlordNoticeById,
);

router.patch(
  "/:id",
  authMiddleware(Role.LANDLORD),
  validateRequest(updateNoticeSchema),
  noticeController.updateNotice,
);

router.delete(
  "/:id",
  authMiddleware(Role.LANDLORD),
  noticeController.deleteNotice,
);

// ---- Tenant ----
router.get("/my", authMiddleware(Role.TENANT), noticeController.getMyNotices);

router.get(
  "/unread-count",
  authMiddleware(Role.TENANT),
  noticeController.getUnreadCount,
);

router.get("/:id", authMiddleware(Role.TENANT), noticeController.getNoticeById);

router.patch(
  "/:id/read",
  authMiddleware(Role.TENANT),
  noticeController.markAsRead,
);

export const noticeRoutes = router;
