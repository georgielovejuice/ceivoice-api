const express = require("express");
const router = express.Router();
const adminTicketController = require("../controllers/admin.ticket.controller");

// TEMP: no auth yet
router.get("/tickets/drafts", adminTicketController.listDrafts);
router.patch("/tickets/:id/draft", adminTicketController.updateDraft);
router.post("/tickets/:id/approve", adminTicketController.approveDraft);

module.exports = router;
