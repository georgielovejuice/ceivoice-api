const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { AllowedTransitions } = require("../constants/ticketStatus");

exports.changeTicketStatus = async ({
  ticketId,
  newStatus,
  changedBy
}) => {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticket_id: ticketId }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const allowed = AllowedTransitions[ticket.status] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${ticket.status} → ${newStatus}`
      );
    }

    await tx.ticket.update({
      where: { ticket_id: ticketId },
      data: { status: newStatus }
    });

    await tx.statusHistory.create({
      data: {
        ticket_id: ticketId,
        old_status: ticket.status,
        new_status: newStatus,
        changed_by: changedBy
      }
    });
  });
};
