import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import validateRequest from "../../middleware/validateRequest";
import { Role } from "../../generated/prisma/enums";
import {
  assignTicketSchema,
  createTicketSchema,
  resolveTicketSchema,
  updateTicketSchema,
} from "./maintenance.validation";
import { maintenanceController } from "./maintenance.controller";

const router = Router();

// ---- Tenant ----
router.post(
  "/",
  authMiddleware(Role.TENANT),
  validateRequest(createTicketSchema),
  maintenanceController.createTicket,
);

router.get(
  "/my",
  authMiddleware(Role.TENANT),
  maintenanceController.getMyTickets,
);

router.get(
  "/:id",
  authMiddleware(Role.TENANT),
  maintenanceController.getTicketById,
);

router.put(
  "/:id",
  authMiddleware(Role.TENANT),
  validateRequest(updateTicketSchema),
  maintenanceController.updateTicket,
);

router.patch(
  "/:id/cancel",
  authMiddleware(Role.TENANT),
  maintenanceController.cancelTicket,
);

router.patch(
  "/:id/close",
  authMiddleware(Role.TENANT),
  maintenanceController.closeTicket,
);

// router.post(
//   "/:id/images",
//   authMiddleware(Role.TENANT),
//   upload.array("images", 5),
//   maintenanceController.uploadTicketImages
// );

// ---- Landlord ----
router.get(
  "/",
  authMiddleware(Role.LANDLORD),
  maintenanceController.getPropertyTickets,
);

router.get(
  "/landlord/:id",
  authMiddleware(Role.LANDLORD),
  maintenanceController.getLandlordTicketById,
);

router.patch(
  "/:id/assign",
  authMiddleware(Role.LANDLORD),
  validateRequest(assignTicketSchema),
  maintenanceController.assignTicket,
);

router.patch(
  "/:id/start",
  authMiddleware(Role.LANDLORD),
  maintenanceController.startTicket,
);

router.patch(
  "/:id/resolve",
  authMiddleware(Role.LANDLORD),
  validateRequest(resolveTicketSchema),
  maintenanceController.resolveTicket,
);

export const maintenanceRoutes = router;
