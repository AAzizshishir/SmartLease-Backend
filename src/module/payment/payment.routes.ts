import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import { paymentController } from "./payment.controller";
import validateRequest from "../../middleware/validateRequest";
import { manualPaymentSchema } from "./payment.validate";

const router = Router();

// Tenant
// All Payment List
router.get("/", authMiddleware(Role.TENANT), paymentController.getMyPayments);

router.get(
  "/current",
  authMiddleware(Role.TENANT),
  paymentController.getCurrentPayment,
);

router.get(
  "/deposit",
  authMiddleware(Role.TENANT),
  paymentController.getDepositPayment,
);

router.patch("/:id/pay", authMiddleware(Role.TENANT), paymentController.payNow);

// Landlord
router.get(
  "/summary",
  authMiddleware(Role.LANDLORD),
  paymentController.getPaymentSummary,
);

router.get(
  "/leases/:lease_id",
  authMiddleware(Role.LANDLORD),
  paymentController.getLeasePayments,
);

router.patch(
  "/:id/mark-paid",
  authMiddleware(Role.LANDLORD),
  validateRequest(manualPaymentSchema),
  paymentController.markAsPaid,
);

// router.patch(
//   "/leases/:lease_id/refund-deposit",
//   authMiddleware(Role.LANDLORD),
//   validateRequest(refundDepositSchema),
//   paymentController.refundDeposit
// );

export const paymentRoutes = router;
