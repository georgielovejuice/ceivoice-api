import { PrismaClient } from "@prisma/client";
import { changeTicketStatus } from "./ticket.service";
import { TicketStatus } from "../constants/ticketStatus";

const prisma = new PrismaClient();

export const getDraftTickets = async () => {
  return prisma.ticket.findMany({
    where: {
      status: TicketStatus.DRAFT
    },
    orderBy: {
      created_at: "desc"
    }
  });
};

export interface UpdateDraftTicketData {
  title?: string;
  summary?: string;
  suggested_solution?: string;
  category_id?: number;
}

export const updateDraftTicket = async (
  ticketId: number,
  updateData: UpdateDraftTicketData
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId }
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== TicketStatus.DRAFT) {
    throw new Error("Only DRAFT tickets can be edited");
  }

  return prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: updateData
  });
};

export const approveDraft = async (ticketId: number, adminId: number) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId }
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== TicketStatus.DRAFT) {
    throw new Error("Only DRAFT tickets can be approved");
  }

  await changeTicketStatus({
    ticketId,
    newStatus: TicketStatus.NEW,
    changedBy: adminId
  });

  return { success: true };
};

export const getActiveTickets = () => {
  return prisma.ticket.findMany({
    where: {
      status: { not: TicketStatus.DRAFT }
    },
    orderBy: { created_at: "desc" },
    include: {
      category: true
    }
  });
};
