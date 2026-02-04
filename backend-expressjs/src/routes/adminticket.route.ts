import express from "express";
import * as adminTicketController from "../controllers/adminticket.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize(["ADMIN"]));

// Admin ticket routes
router.get("/tickets/drafts", adminTicketController.listDrafts);
router.patch("/tickets/:id/draft", adminTicketController.updateDraft);
router.post("/tickets/:id/approve", adminTicketController.approveDraft);
router.get("/tickets", adminTicketController.listActiveTickets);

export default router;
