import { Router } from "express";
import { propertyRoutes } from "../module/property/property.route";
import { unitRoutes } from "../module/unit/unit.routes";
import { userRoutes } from "../module/user/user.routes";
import { leaseApplication } from "../module/leaseApplication/leaseApplication.routes";

const router = Router();

// User
router.use("/users", userRoutes);

// Property Route
router.use("/properties", propertyRoutes);

// Unit Route
router.use("/unit", unitRoutes);

// Lease Application
router.use("/lease-application", leaseApplication);

export const indexRoutes = router;
