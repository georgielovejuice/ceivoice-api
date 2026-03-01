import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes - Authenticated users only
router.use(authenticate);

// Get tickets created by the logged-in user
router.get("/mine", ticketController.getMyTickets);

// Get tickets assigned to the logged-in user (EP04-ST001)
router.get("/assigned", authorize(["ASSIGNEE", "ADMIN"]), ticketController.getAssignedTickets);

// List all users with ASSIGNEE role (for reassign picker, EP04-ST004)
router.get("/assignee-list", authorize(["ASSIGNEE", "ADMIN"]), ticketController.listAssignees);

// Get specific ticket
router.get("/id/:id", ticketController.getTicketById);

// Get tickets by status
router.get("/status/:status", ticketController.getTicketsByStatus);

// Draft tickets management - Admin only
router.get("/", authorize(["ADMIN"]), async (req, res) => {
  return ticketController.getDraftTickets(req, res);
});
router.put("/id/:id", authorize(["ADMIN"]), ticketController.editDraftTicket);
router.put("/id/:id/deadline", authorize(["ADMIN"]), ticketController.setDeadline);

// Ticket status updates - Assignee and Admin (EP04-ST002)
router.patch("/id/:id/status", authorize(["ASSIGNEE", "ADMIN"]), ticketController.updateStatus);

// Assignment management - Assignee and Admin
router.post("/id/:id/assign", authorize(["ASSIGNEE", "ADMIN"]), ticketController.assignTicket);
router.post("/id/:id/unassign", authorize(["ASSIGNEE", "ADMIN"]), ticketController.unassignTicket);

// Comments
router.post("/id/:id/comments", ticketController.addComment);
router.get("/id/:id/comments", ticketController.getComments);

// Followers
router.post("/id/:id/followers", ticketController.addFollower);
router.get("/id/:id/followers", ticketController.getFollowers);

export default router;
