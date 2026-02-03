const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { changeTicketStatus } = require("./ticket");

exports.getDraftTickets = async () => {
  return prisma.ticket.findMany({
    where: {
      status: "DRAFT"
    },
    orderBy: {
      created_at: "desc"
    }
  });
};

exports.updateDraftTicket = async (ticketId, updateData) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId }
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "DRAFT") {
    throw new Error("Only DRAFT tickets can be edited");
  }

  return prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: updateData
  });
};

exports.approveDraft = async (ticketId, adminId) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId }
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "DRAFT") {
    throw new Error("Only DRAFT tickets can be approved");
  }

  await changeTicketStatus({
    ticketId,
    newStatus: "NEW",
    changedBy: adminId
  });

  return { success: true };
};

exports.getActiveTickets = () => {
  return prisma.ticket.findMany({
    where: {
      status: { not: "DRAFT" }
    },
    orderBy: { created_at: "desc" },
    include: {
      category: true
    }
  });
};
