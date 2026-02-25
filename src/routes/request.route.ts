import { Router } from "express";
import * as requestController from "../controllers/request.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/", requestController.submitRequest);
router.get("/track/:tracking_id", requestController.trackRequest);

// Protected routes - Admin only
router.get("/", authenticate, authorize(["ADMIN"]), requestController.getAllRequests);
router.post("/verify-token", requestController.verifyTrackingToken);

export default router;
