import express from "express";
import * as controller from "../controllers/request.controller";

const router = express.Router();

// EP01-ST001: Submit request
router.post("/", controller.submitRequest);

// EP01-ST003: Track request by tracking ID
router.get("/track/:tracking_id", controller.trackRequest);

// Get all requests (admin)
router.get("/", controller.getAllRequests);

export default router;
