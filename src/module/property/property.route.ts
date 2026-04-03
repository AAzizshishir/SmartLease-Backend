import { Router } from "express";
import { propertyController } from "./property.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.get("/all", propertyController.getAllProperties); // public route

router.use(authMiddleware(Role.LANDLORD));

router.post("/", propertyController.createProperty);
router.get("/", propertyController.getMyProperties);
router.get("/:id", propertyController.getPropertyById);
router.put("/:id", propertyController.updateProperty);
router.delete("/:id", propertyController.deleteProperty);

export const propertyRoutes = router;
