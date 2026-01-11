const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.updateStatus = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { new_status, user_id } = req.body;

    if (!new_status || !user_id) {
      return res.status(400).json({ error: "new_status and user_id required" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Update ticket status
    await prisma.ticket.update({
      where: { ticket_id: ticketId },
      data: { status: new_status }
    });

    // Log history (audit)
    await prisma.statusHistory.create({
      data: {
        ticket_id: ticketId,
        old_status: ticket.status,
        new_status,
        changed_by: user_id
      }
    });

    res.json({ message: "Status updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
