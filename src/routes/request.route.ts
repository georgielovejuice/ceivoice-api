import { Router } from "express";
import * as requestController from "../controllers/request.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes - Must be authenticated
router.post("/", authenticate, requestController.submitRequest);

// Public routes - No auth needed
router.get("/track/:tracking_id", requestController.trackRequest);

// Protected routes - Admin only
router.get("/", authenticate, authorize(["ADMIN"]), requestController.getAllRequests);
router.post("/verify-token", requestController.verifyTrackingToken);

export default router;
