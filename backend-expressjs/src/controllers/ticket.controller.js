const { changeTicketStatus } = require("../services/ticket.service");

exports.updateStatus = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { new_status } = req.body;

    // TEMP: until auth middleware is added
    const userId = req.user?.user_id ?? 0;

    if (!new_status) {
      return res.status(400).json({ error: "new_status required" });
    }

    await changeTicketStatus({
      ticketId,
      newStatus: new_status.toUpperCase(),
      changedBy: userId
    });

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
