import { Request, Response } from "express";
import * as db from "../../repositories";
import { STATUS_ID, REASSIGNABLE_STATUS_IDS } from "../../constants/ticketStatus";
import * as emailService from "../../services/email.service";

export const assignTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId    = Number.parseInt(req.params.id, 10);
    const { assignee_id } = req.body;

    if (!assignee_id) {
      res.status(400).json({ error: "assignee_id required" });
      return;
    }

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Only allow reassignment for: Draft, New, Assigned, Failed
    if (ticket.status_id && !REASSIGNABLE_STATUS_IDS.includes(ticket.status_id)) {
      res.status(400).json({
        error: `Cannot reassign ticket with status "${ticket.status?.name}". Reassignment is only allowed for Draft, New, Assigned, and Failed tickets.`,
        current_status: ticket.status?.name,
        current_status_id: ticket.status_id
      });
      return;
    }

    const oldAssigneeId = ticket.assignee_user_id || null;
    await db.assignTicket(ticketId, assignee_id);
    await db.createAssignmentHistory(
      ticketId, oldAssigneeId, assignee_id, req.user.user_id
    );

    // Move to Assigned if currently New
    if (ticket.status_id === STATUS_ID.NEW) {
      await db.updateTicket(ticketId, { status_id: STATUS_ID.ASSIGNED });
    }

    // Send reassignment notification email
    try {
      const assignee = await db.getUserById(assignee_id);
      if (assignee?.email) {
        await emailService.sendAssignmentNotificationEmail(
          assignee.email,
          ticketId,
          ticket.title || `Ticket #${ticketId}`,
          assignee.full_name || assignee.user_name || "Support Team",
          !!oldAssigneeId
        );
      }
    } catch (err) {
      console.warn("Failed to send reassignment notification email:", err);
    }

    res.json({ message: "Ticket assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unassignTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    await db.unassignTicket(ticketId);
    res.json({ message: "Ticket unassigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
