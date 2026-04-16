import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import validateRequest from "../../middleware/validateRequest";
import { leaseApplicationController } from "./leaseApplication.controller";
import {
  createLeaseApplicationSchema,
  rejectApplicationSchema,
} from "./leaseApplication.validate";
import { Role } from "../../generated/prisma/enums";

const router = Router();

// ---- Applications — Tenant ----
router.post(
  "/",
  authMiddleware(Role.TENANT),
  validateRequest(createLeaseApplicationSchema),
  leaseApplicationController.applyForUnit,
);

router.get(
  "/tenant",
  authMiddleware(Role.TENANT),
  leaseApplicationController.getTenantApplications,
);

router.patch(
  "/:id/cancel",
  authMiddleware(Role.TENANT),
  leaseApplicationController.cancelApplication,
);

// ---- Applications — Landlord ----
router.get(
  "/landlord",
  authMiddleware(Role.LANDLORD),
  leaseApplicationController.getLandlordApplications,
);

router.get("/:id", leaseApplicationController.getApplicationDetails);

router.patch(
  "/landlord/:id/approve",
  authMiddleware(Role.LANDLORD),
  leaseApplicationController.approveApplication,
);

router.patch(
  "/landlord/:id/reject",
  authMiddleware(Role.LANDLORD),
  validateRequest(rejectApplicationSchema),
  leaseApplicationController.rejectApplication,
);

export const leaseApplication = router;
