import { Request, Response } from "express";
import * as db from "../../repositories";
import { STATUS_ID, REASSIGNABLE_STATUS_IDS } from "../../constants/ticketStatus";
import * as emailService from "../../services/email.service";

export const assignTicketToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    const { assignee_id } = req.body;

    if (!assignee_id) {
      res.status(400).json({ error: "assignee_id is required" });
      return;
    }

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Only allow assignment for: Draft, New, Assigned, Failed
    if (ticket.status_id && !REASSIGNABLE_STATUS_IDS.includes(ticket.status_id)) {
      res.status(400).json({
        error: `Cannot assign ticket with status "${ticket.status?.name}". Assignment is only allowed for Draft, New, Assigned, and Failed tickets.`,
        current_status: ticket.status?.name,
        current_status_id: ticket.status_id
      });
      return;
    }

    const oldAssigneeId = ticket.assignee_user_id || null;
    const adminUser = req.user;

    await Promise.all([
      db.assignTicket(ticketId, assignee_id),
      db.createAssignmentHistory(ticketId, oldAssigneeId, assignee_id, adminUser?.user_id ?? "")
    ]);

    // Move to Assigned if currently New
    if (ticket.status_id === STATUS_ID.NEW) {
      await db.updateTicket(ticketId, { status_id: STATUS_ID.ASSIGNED });
    }

    // Send email and in-app notification to new assignee
    const newAssignee = await db.getUserById(assignee_id);
    if (newAssignee?.email) {
      emailService.sendAssignmentNotificationEmail(
        newAssignee.email,
        ticketId,
        ticket.title || "Untitled Ticket",
        newAssignee.full_name || "Support Team",
        !!oldAssigneeId
      ).catch((err) => console.error(`Failed to send assignment email to ${newAssignee.email}:`, err));
    }

    await db.createNotification(
      ticketId,
      assignee_id,
      "assignment",
      `You have been assigned to ticket: ${ticket.title || "Ticket #" + ticketId}`
    );

    res.json({ message: "Ticket assigned successfully" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getAssigneeList = async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignees = await db.getAllAssignees();
    res.json(assignees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
