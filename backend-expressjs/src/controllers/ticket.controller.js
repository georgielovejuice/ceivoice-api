const { changeTicketStatus } = require("../services/ticket.service");

exports.updateStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const ticketId = parseInt(req.params.id);
    const { new_status } = req.body;

    if (!new_status) {
      return res.status(400).json({ error: "new_status required" });
    }

    await changeTicketStatus({
      ticketId,
      newStatus: new_status.toUpperCase(),
      changedBy: req.user.user_id,
      userRole: req.user.role
    });

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

