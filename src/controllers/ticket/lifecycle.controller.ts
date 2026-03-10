import { Request, Response } from "express";
import * as db from "../../repositories";
import * as emailService from "../../services/email.service";

export const getDraftTickets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drafts = await db.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editDraftTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id);
    const { title, summary, category_id, suggested_solution, assignee_user_id } = req.body;

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (title && title.length > 100) {
      res.status(400).json({ error: "Title must be less than 100 characters" });
      return;
    }
    if (summary && summary.length > 500) {
      res.status(400).json({ error: "Summary must be less than 500 characters" });
      return;
    }

    const updatedTicket = await db.updateTicket(ticketId, {
      title:             title             || ticket.title,
      summary:           summary           || ticket.summary,
      category_id:       category_id       || ticket.category_id,
      suggested_solution: suggested_solution || ticket.suggested_solution,
      assignee_user_id:  assignee_user_id  || ticket.assignee_user_id
    });

    res.json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setDeadline = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id);
    const { deadline } = req.body;

    if (!deadline) {
      res.status(400).json({ error: "Deadline is required" });
      return;
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      res.status(400).json({ error: "Invalid deadline format" });
      return;
    }

    const ticket = await db.updateTicket(ticketId, { deadline: deadlineDate });
    res.json({ message: "Deadline set successfully", ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * ACTIVATE DRAFT TICKET (Draft → New)
 * Admin reviews the AI-generated draft, optionally edits fields, then submits.
 * Status changes from Draft → New, confirmation email sent, ticket enters assignee queue.
 */
export const activateDraftTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId    = Number.parseInt(req.params.id, 10);
    const adminUserId = req.user.user_id;

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.status?.name !== "Draft") {
      res.status(400).json({ error: "Only Draft tickets can be activated", current_status: ticket.status?.name });
      return;
    }
    if (!ticket.title?.trim()) {
      res.status(400).json({ error: "Title is required before activation" });
      return;
    }
    if (!ticket.category_id) {
      res.status(400).json({ error: "Category is required before activation" });
      return;
    }

    const draftStatusId = 1;
    const newStatusId   = 2;

    await db.updateTicket(ticketId, {
      status_id: newStatusId,
      activated_at: new Date(),
      activated_by_id: adminUserId
    });

    await db.finaliseAiMetric(ticketId, ticket.category_id, ticket.assignee_user_id ?? null);
    await db.createStatusHistory(ticketId, draftStatusId, newStatusId, adminUserId);

    if (ticket.ticket_requests.length > 0) {
      const request = ticket.ticket_requests[0]?.request;
      if (request) {
        await emailService.sendConfirmationEmail(request.email, request.tracking_id, ticketId);
      }
    }

    res.json({
      message: "Draft ticket activated successfully",
      ticket_id: ticketId,
      status_id: newStatusId,
      status_name: "New",
      activated_by: adminUserId
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message || "Failed to activate ticket" });
  }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId   = Number.parseInt(req.params.id, 10);
    const { new_status } = req.body;

    if (!new_status) {
      res.status(400).json({ error: "new_status required" });
      return;
    }

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const statusMap: Record<string, number> = {
      Draft: 1, New: 2, Assigned: 3, Solving: 4, Solved: 5, Failed: 6, Renew: 7
    };
    const newStatusId = statusMap[new_status];
    if (!newStatusId) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const oldStatusId = ticket.status_id;
    await db.updateTicket(ticketId, { status_id: newStatusId });

    if (oldStatusId && newStatusId !== oldStatusId) {
      await db.createStatusHistory(ticketId, oldStatusId, newStatusId, req.user.user_id);
    }

    if (newStatusId !== oldStatusId && ticket.ticket_requests?.length > 0) {
      const request = ticket.ticket_requests[0]?.request;
      if (request) {
        await emailService.sendStatusChangeEmail(request.email, ticketId, new_status, request.tracking_id);
      }
    }

    // In-app notification → assignee only when someone else (e.g. admin) changes the status.
    // Skip if the assignee is the one making the change — no self-notifications.
    const changedByUser = req.user.user_id;
    if (
      oldStatusId &&
      newStatusId !== oldStatusId &&
      ticket.assignee_user_id &&
      ticket.assignee_user_id !== changedByUser
    ) {
      db.createNotification(
        ticketId,
        ticket.assignee_user_id,
        "status_change",
        `Ticket #${ticketId} status changed to ${new_status}`
      ).catch((err) => console.warn("Failed to create status notification:", err));
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message || "Failed to update status" });
  }
};
