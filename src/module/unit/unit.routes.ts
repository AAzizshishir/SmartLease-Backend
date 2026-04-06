// unit.route.ts
import { Router } from "express";
import { unitController } from "./unit.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import { createUnitSchema, updateUnitSchema } from "./unite.validate";
import validateRequest from "../../middleware/validateRequest";
import { upload } from "../../config/multer.config";

const router = Router();

// public routes
router.get("/", unitController.getAllVacantUnits);
router.get("/:unit_id", unitController.getUnitById);
router.get("/:unit_id/images", unitController.getUnitImages);

// protected routes for landlord
router.post(
  "/:property_id",
  authMiddleware(Role.LANDLORD),
  validateRequest(createUnitSchema),
  unitController.addUnitInProperty,
);

router.put(
  "/:unit_id",
  authMiddleware(Role.LANDLORD),
  validateRequest(updateUnitSchema),
  unitController.updateUnit,
);

router.delete(
  "/:unit_id",
  authMiddleware(Role.LANDLORD),
  unitController.deleteUnit,
);

router.patch(
  "/:unit_id/restore",
  authMiddleware(Role.LANDLORD),
  unitController.restoreUnit,
);

// ---- Images ---- //

router.post(
  "/:unit_id/images",
  authMiddleware(Role.LANDLORD),
  upload.array("images", 10),
  unitController.uploadUnitImages,
);

// set primary image
router.patch(
  "/:unit_id/images/:image_id/primary",
  authMiddleware(Role.LANDLORD),
  unitController.setPrimaryImage,
);

// delete image
router.delete(
  "/:unit_id/images/:image_id",
  authMiddleware(Role.LANDLORD),
  unitController.deleteUnitImage,
);

export const unitRoutes = router;
