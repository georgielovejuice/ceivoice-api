import express from "express";
import * as controller from "../controllers/admin.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Require authentication for all admin routes
router.use(authenticateToken);

// EP06-ST001: Toggle assignee role
router.post("/assignees/role", controller.toggleAssigneeRole);

// EP06-ST002: Assign scope
router.post("/assignees/scope", controller.assignScope);

// EP06-ST002: Remove scope
router.delete("/assignees/scope", controller.removeScope);

// EP06-ST002: Get assignee scopes
router.get("/assignees/:user_id/scopes", controller.getAssigneeScopes);

// Get all assignees
router.get("/assignees", controller.getAllAssignees);

// EP06-ST003: Admin report dashboard
router.get("/reports/dashboard", controller.getAdminDashboard);

// EP06-ST004: Assignee personal reports
router.get("/reports/assignee/:user_id", controller.getAssigneeMetrics);

// EP06-ST005: Audit trail
router.get("/audit-trail/:ticket_id", controller.getAuditTrail);

export default router;
