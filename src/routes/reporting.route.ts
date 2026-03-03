import { Router } from "express";
import * as reportingController from "../controllers/reporting.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===== ADMIN REPORTING =====
// GET /api/reporting/admin/metrics?period=last_30_days
// Global dashboard: Total Volume, Resolution Times, Current Backlogs (REP-ADM-001)
router.get(
  "/admin/metrics",
  authorize(["ADMIN"]),
  reportingController.getAdminMetrics
);

// GET /api/reporting/admin/category-trends?days=30
// Trend Analysis: Top Categories and volume trends (REP-ADM-002)
router.get(
  "/admin/category-trends",
  authorize(["ADMIN"]),
  reportingController.getCategoryTrends
);

// GET /api/reporting/admin/ai-accuracy?period=last_30_days
// AI Accuracy: Processing time, category match rate, suggestion acceptance (REP-AI-001)
router.get(
  "/admin/ai-accuracy",
  authorize(["ADMIN"]),
  reportingController.getAiAccuracyMetrics
);

// ===== ASSIGNEE REPORTING =====
// GET /api/reporting/assignee/workload?sort_by=deadline
// Workload Dashboard: Active tickets sorted by urgency/deadline (REP-ASG-001)
router.get(
  "/assignee/workload",
  authorize(["ASSIGNEE", "ADMIN"]),
  reportingController.getAssigneeWorkload
);

// GET /api/reporting/assignee/performance?period=last_30_days
// Personal Performance: Tickets Solved, Success Rate, Avg Resolution Time (REP-ASG-002)
router.get(
  "/assignee/performance",
  authorize(["ASSIGNEE", "ADMIN"]),
  reportingController.getAssigneePerformance
);

export default router;
