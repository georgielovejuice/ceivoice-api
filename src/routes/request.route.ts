import { Router } from "express";
import * as requestController from "../controllers/request.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Public route - no auth required (anyone can submit a request)
router.post("/", requestController.submitRequest);

// Public routes - No auth needed
router.get("/track/:tracking_id", requestController.trackRequest);

// Protected routes - Admin only
router.get("/", authenticate, authorize(["ADMIN"]), requestController.getAllRequests);
router.post("/verify-token", requestController.verifyTrackingToken);

export default router;
