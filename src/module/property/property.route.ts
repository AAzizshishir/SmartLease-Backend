import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validate";
// import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get("/", propertyController.getAllProperties); // public route

// get property by id
router.get("/:id", propertyController.getPropertyById); // details

router.use(authMiddleware(Role.LANDLORD));

// Create Property
router.post(
  "/",
  // multerUpload.single("file"),
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

export const propertyRoutes = router;
