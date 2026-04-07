import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validate";
import { upload } from "../../config/multer.config";

const router = Router();

router.get("/", propertyController.getAllProperties); // public route

// get property by id
router.get("/:id", propertyController.getPropertyById); // details

router.get("/:property_id/images", propertyController.getPropertyImages);

router.use(authMiddleware(Role.LANDLORD));

// Create Property
router.post(
  "/",
  validateRequest(createPropertySchema),
  propertyController.createProperty,
);

// get my properties (landlord properties)
router.get("/", propertyController.getMyProperties);

// update property
router.put(
  "/:id",
  validateRequest(updatePropertySchema),
  propertyController.updateProperty,
);

// delete property
router.delete("/:id", propertyController.deleteProperty);

// restore property
router.patch("/:id/restore", propertyController.restoreProperty);

// ---- Images ---- //

router.post(
  "/:property_id/images",
  authMiddleware(Role.LANDLORD),
  upload.array("images", 10),
  propertyController.uploadPropertyImages,
);

// set primary image
// router.patch(
//   "/:unit_id/images/:image_id/primary",
//   authMiddleware(Role.LANDLORD),
//   propertyController.setPrimaryImage,
// );

// delete image
router.delete(
  "/:property_id/images/:image_id",
  authMiddleware(Role.LANDLORD),
  propertyController.deletePropertyImage,
);

export const propertyRoutes = router;
