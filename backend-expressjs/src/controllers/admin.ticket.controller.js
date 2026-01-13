const adminTicketService = require("../services/admin.ticket.service");

// list draft tickets
exports.listDrafts = async (req, res) => {
  try {
    const drafts = await adminTicketService.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch draft tickets" });
  }
};

// update a draft ticket
exports.updateDraft = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedTicket = await adminTicketService.updateDraftTicket(
      ticketId,
      updateData
    );

    res.json(updatedTicket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// approve a draft ticket
exports.approveDraft = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    // TEMP until auth middleware exists
    const adminId = req.user?.user_id || 0;

    const result = await adminTicketService.approveDraft(ticketId, adminId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// list active tickets
exports.listActiveTickets = async (req, res) => {
  try {
    const tickets = await adminTicketService.getActiveTickets();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};


