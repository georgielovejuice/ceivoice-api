const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { AllowedTransitions, RoleTransitions } = require("../constants/ticketStatus");

exports.changeTicketStatus = async ({
  ticketId,
  newStatus,
  changedBy,
  userRole
}) => {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticket_id: ticketId }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const currentStatus = ticket.status;

    // Global state machine validation
    const allowedTransitions = AllowedTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}`
      );
    }

    // Role-based permission validation
    const roleAllowedTransitions =
      RoleTransitions[userRole]?.[currentStatus] || [];

    if (!roleAllowedTransitions.includes(newStatus)) {
      throw new Error(
        `Forbidden status transition for role ${userRole}: ${currentStatus} → ${newStatus}`
      );
    }

    // Update ticket
    await tx.ticket.update({
      where: { ticket_id: ticketId },
      data: { status: newStatus }
    });

    // Audit log
    await tx.statusHistory.create({
      data: {
        ticket_id: ticketId,
        old_status: currentStatus,
        new_status: newStatus,
        changed_by: changedBy
      }
    });
  });
};
