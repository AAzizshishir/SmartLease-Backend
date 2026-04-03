import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validate";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get("/all", propertyController.getAllProperties); // public route

router.use(authMiddleware(Role.LANDLORD));

// Create Property
router.post(
  "/",
  multerUpload.single("file"),
  validateRequest(createPropertySchema),
  propertyController.createProperty,
);

// get my properties (landlord properties)
router.get("/", propertyController.getMyProperties);

// restore property
router.patch("/:id/restore", propertyController.restoreProperty);

// get property by id
router.get("/:id", propertyController.getPropertyById);

// update property
router.put(
  "/update/:id",
  validateRequest(updatePropertySchema),
  propertyController.updateProperty,
);

// delete property
router.delete("/:id", propertyController.deleteProperty);

export const propertyRoutes = router;
