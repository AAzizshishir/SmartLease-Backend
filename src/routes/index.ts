import { Router } from "express";
import { propertyRoutes } from "../module/property/property.route";

const router = Router();

// Property Routes
router.use("/property", propertyRoutes);

export const indexRoutes = router;
