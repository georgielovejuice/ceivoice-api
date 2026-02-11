import { Router } from "express";
import * as workflowController from "../controllers/workflow.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===== DRAFT ACTIVATION (Admin Only) =====
// POST /api/workflow/drafts/:id/activate
// Transition: Draft → New
router.post(
  "/drafts/:id/activate",
  authorize(["ADMIN"]),
  workflowController.activateDraft
);

// ===== TICKET RESOLUTION (Assignee/Admin) =====
// POST /api/workflow/tickets/:id/resolve
// Transition: Any Status → Solved/Failed (with required resolution comment)
router.post(
  "/tickets/:id/resolve",
  authorize(["ASSIGNEE", "ADMIN"]),
  workflowController.resolveTicket
);

// ===== TICKET Rly ENEWAL (Assignee/Admin) =====
// POST /api/workflow/tickets/:id/renew
// Transition: Solved/Failed → Renew
router.post(
  "/tickets/:id/renew",
  authorize(["ASSIGNEE", "ADMIN"]),
  workflowController.renewTicket
);

export default router;
