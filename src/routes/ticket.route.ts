import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes - Authenticated users only
router.use(authenticate);

// Get tickets created by the logged-in user
router.get("/mine", ticketController.getMyTickets);

// Get specific ticket
router.get("/:id", ticketController.getTicketById);

// Get tickets by status
router.get("/status/:status", ticketController.getTicketsByStatus);

// Draft tickets management - Admin only
router.get("/", authorize(["ADMIN"]), async (req, res) => {
  return ticketController.getDraftTickets(req, res);
});
router.put("/:id", authorize(["ADMIN"]), ticketController.editDraftTicket);
router.put("/:id/deadline", authorize(["ADMIN"]), ticketController.setDeadline);

// Ticket status updates - Admin only
router.patch("/:id/status", authorize(["ADMIN"]), ticketController.updateStatus);

// Assignment management - Assignee and Admin
router.post("/:id/assign", authorize(["ASSIGNEE", "ADMIN"]), ticketController.assignTicket);
router.post("/:id/unassign", authorize(["ASSIGNEE", "ADMIN"]), ticketController.unassignTicket);

// Comments
router.post("/:id/comments", ticketController.addComment);
router.get("/:id/comments", ticketController.getComments);

// Followers
router.post("/:id/followers", ticketController.addFollower);
router.get("/:id/followers", ticketController.getFollowers);

export default router;
