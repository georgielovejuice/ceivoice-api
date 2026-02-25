import { Router } from "express";
import * as adminController from "../controllers/adminticket.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize(["ADMIN"]));

// Draft management
router.get("/drafts", adminController.listDrafts);
router.put("/drafts/:id", adminController.updateDraft);
router.post("/drafts/:id/approve", adminController.approveDraft);

// Active tickets
router.get("/active", adminController.listActiveTickets);

// Assignment
router.post("/:id/assign", adminController.assignTicketToUser);
router.get("/assignees", adminController.getAssigneeList);

// Statistics
router.get("/stats", adminController.getTicketStats);

// Notifications
router.get("/notifications", adminController.getUserNotifications);
router.put("/notifications/:id/read", adminController.markNotificationAsRead);

export default router;
