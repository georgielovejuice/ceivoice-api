import express from "express";
import * as controller from "../controllers/ticket.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// EP03-ST001: Get draft tickets
router.get("/drafts", controller.getDraftTickets);

// EP03-ST002: Edit draft ticket
router.put("/drafts/:id", controller.editDraftTicket);

// EP03-ST003: Set deadline
router.put("/:id/deadline", controller.setDeadline);

// EP03-ST004: Merge requests
router.post("/merge", controller.mergeRequests);

// EP03-ST005: Unlink request
router.post("/unlink", controller.unlinkRequest);

// EP03-ST006: Submit draft to new ticket
router.post("/:id/submit", controller.submitDraftToNewTicket);

// EP04-ST001: Get assignee workload
router.get("/assignee/:assignee_id/workload", controller.getAssigneeWorkload);

// EP04-ST002: Update ticket status
router.post("/:id/status", controller.updateStatus);

// EP04-ST003: Get status history
router.get("/:id/status-history", controller.getStatusHistory);

// EP04-ST004: Reassign ticket
router.post("/:id/reassign", controller.reassignTicket);

// EP04-ST005: Get assignment history
router.get("/:id/assignment-history", controller.getAssignmentHistory);

// EP05-ST001: Get comments
router.get("/:id/comments", controller.getComments);

// EP05-ST002: Add comment
router.post("/:id/comments", controller.addComment);

// EP05-ST003: Get ticket participants
router.get("/:id/participants", controller.getTicketParticipants);

// Get ticket by ID
router.get("/:id", controller.getTicketById);

// Get all tickets
router.get("/", controller.getAllTickets);

export default router;
