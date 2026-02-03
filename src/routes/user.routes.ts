import express from "express";
import * as controller from "../controllers/user.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Get user by ID
router.get("/:user_id", controller.getUserById);

// Get user by email
router.get("/email/:email", controller.getUserByEmail);

// Get user notifications
router.get("/:user_id/notifications", authenticateToken, controller.getUserNotifications);

// Mark notification as read
router.put("/notifications/:notification_id/read", authenticateToken, controller.markNotificationAsRead);

export default router;
