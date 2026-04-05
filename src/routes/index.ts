import { Router } from "express";
import { propertyRoutes } from "../module/property/property.route";
import { unitRoutes } from "../module/unit/unit.routes";

const router = Router();

// Property Route
router.use("/properties", propertyRoutes);

// Unit Route
router.use("/unit", unitRoutes);

export const indexRoutes = router;
