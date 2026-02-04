import { PrismaClient } from "@prisma/client";
import { AllowedTransitions, RoleTransitions, TicketStatus, UserRole } from "../constants/ticketStatus";

const prisma = new PrismaClient();

export interface ChangeTicketStatusParams {
  ticketId: number;
  newStatus: TicketStatus;
  changedBy: number;
  userRole?: UserRole;
}

export const changeTicketStatus = async ({
  ticketId,
  newStatus,
  changedBy,
  userRole = "USER"
}: ChangeTicketStatusParams): Promise<void> => {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { ticket_id: ticketId }
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const currentStatus = ticket.status as TicketStatus;

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
