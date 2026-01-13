const express = require("express");
const router = express.Router();

const adminTicketController = require("../controllers/admin.ticket.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize(["ADMIN"]));

// Admin ticket routes
router.get("/tickets/drafts", adminTicketController.listDrafts);
router.patch("/tickets/:id/draft", adminTicketController.updateDraft);
router.post("/tickets/:id/approve", adminTicketController.approveDraft);
router.get("/tickets", adminTicketController.listActiveTickets);
module.exports = router;
