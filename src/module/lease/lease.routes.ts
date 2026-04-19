import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import { createLeaseSchema } from "./lease.validate";
import { leaseController } from "./lease.controller";

const router = Router();

// Tenant
router.get(
  "/my-lease",
  authMiddleware(Role.TENANT),
  leaseController.getMyLease,
);

// Landlord
router.post(
  "/:application_id",
  authMiddleware(Role.LANDLORD),
  // validateRequest(createLeaseSchema),
  leaseController.createLease,
);

router.get(
  "/",
  authMiddleware(Role.LANDLORD),
  leaseController.getLandlordLeases,
);

// Lease Details api
router.get(
  "/:lease_id",
  authMiddleware(Role.LANDLORD),
  leaseController.getLeaseDetails,
);

router.patch(
  "/:id/terminate",
  authMiddleware(Role.LANDLORD),
  leaseController.terminateLease,
);

router.patch(
  "/:id/confirm",
  authMiddleware(Role.TENANT),
  leaseController.confirmLease,
);

export const leaseRoutes = router;
