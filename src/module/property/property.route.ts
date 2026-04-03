import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import {
  createPropertySchema,
  updatePropertySchema,
} from "./property.validate";

const router = Router();

router.get("/all", propertyController.getAllProperties); // public route

router.use(authMiddleware(Role.LANDLORD));

router.post(
  "/",
  validateRequest(createPropertySchema),
  propertyController.createProperty,
);
router.get("/", propertyController.getMyProperties);

router.patch("/restore/:id", propertyController.restoreProperty);

router.get("/:id", propertyController.getPropertyById);
router.put(
  "/:id",
  validateRequest(updatePropertySchema),
  propertyController.updateProperty,
);
router.delete("/:id", propertyController.deleteProperty);

export const propertyRoutes = router;
