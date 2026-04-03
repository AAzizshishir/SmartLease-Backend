import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";
import validateRequest from "../../middleware/validateRequest";
import {
  createPropertySchema,
  propertyParamsSchema,
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
router.get(
  "/:id",
  validateRequest(propertyParamsSchema),
  propertyController.getPropertyById,
);
router.put(
  "/:id",
  validateRequest(updatePropertySchema),
  validateRequest(propertyParamsSchema),
  propertyController.updateProperty,
);
router.delete(
  "/:id",
  validateRequest(propertyParamsSchema),
  propertyController.deleteProperty,
);

export const propertyRoutes = router;
