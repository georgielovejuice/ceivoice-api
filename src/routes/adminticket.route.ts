import { Router } from "express";
import * as adminController from "../controllers/adminticket.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize(["ADMIN"]));

// All tickets
router.get("/tickets", adminController.listAllTickets);

// Draft management
router.get("/drafts", adminController.listDrafts);
router.put("/drafts/:id", adminController.updateDraft);
router.post("/drafts/:id/approve", adminController.approveDraft);

// Active tickets
router.get("/active", adminController.listActiveTickets);

// Assignment
router.post("/:id/assign", adminController.assignTicketToUser);
router.get("/assignees", adminController.getAssigneeList);

// Categories
router.get("/categories", adminController.listCategories);

// Statistics
router.get("/stats", adminController.getTicketStats);

// Notifications
router.get("/notifications", adminController.getUserNotifications);
router.put("/notifications/:id/read", adminController.markNotificationAsRead);

// Merge/Unmerge
router.post("/:id/merge", adminController.mergeTickets);
router.post("/:id/unmerge", adminController.unmergeTicket);

// Unlink request from ticket (ST005)
router.delete("/tickets/:ticketId/requests/:requestId", adminController.unlinkRequest);

// List all users (admin user management)
router.get("/users", adminController.listUsers);

// User role management (EP06-ST001)
router.patch("/users/:userId/role", adminController.updateUserRole);

// Assignee scope management (EP06-ST002)
router.get("/assignees/:assigneeId/scopes", adminController.getAssigneeScopes);
router.post("/assignees/:assigneeId/scopes", adminController.addAssigneeScope);
router.delete("/assignees/:assigneeId/scopes/:scopeId", adminController.removeAssigneeScope);

export default router;
