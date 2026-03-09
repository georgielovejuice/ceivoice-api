import { Request, Response } from "express";
import * as db from "../../repositories";
import * as emailService from "../../services/email.service";
import { STATUS_ID } from "../../constants/ticketStatus";

export const listDrafts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drafts = await db.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch draft tickets" });
  }
};

export const updateDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    const { title, summary, suggested_solution, category_id, deadline, assignee_user_id } = req.body;

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

    const updateData: Record<string, unknown> = {};
    if (title)             updateData.title = title;
    if (summary)           updateData.summary = summary;
    if (suggested_solution) updateData.suggested_solution = suggested_solution;
    if (category_id)       updateData.category_id = category_id;
    if (assignee_user_id)  updateData.assignee_user_id = assignee_user_id;
    if (deadline)          updateData.deadline = new Date(deadline);

    const updatedTicket = await db.updateTicket(ticketId, updateData);
    res.json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message });
  }
};

async function activateChildTickets(
  childTickets: { ticket_id: number }[],
  now: Date,
  adminId: string,
  assignee_user_id?: string
): Promise<void> {
  for (const child of childTickets) {
    await db.updateTicket(child.ticket_id, {
      status_id: STATUS_ID.NEW,
      activated_at: now,
      activated_by_id: adminId,
      ...(assignee_user_id ? { assignee_user_id } : {})
    });
    await db.createStatusHistory(child.ticket_id, STATUS_ID.DRAFT, STATUS_ID.NEW, adminId);
  }
}

async function addRequestCreatorsAsFollowers(
  ticketId: number,
  ticketRequests: { request: { email: string } | null }[]
): Promise<void> {
  for (const tr of ticketRequests) {
    if (!tr.request?.email) continue;
    try {
      const user = await db.getUserByEmail(tr.request.email);
      if (user) await db.addFollower(ticketId, user.user_id);
    } catch (err) {
      console.warn(`Failed to add follower for ${tr.request.email}:`, err);
    }
  }
}

export const approveDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = Number.parseInt(req.params.id, 10);

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.status?.name !== "Draft") {
      res.status(400).json({ error: "Only draft tickets can be approved" });
      return;
    }

    const now     = new Date();
    const adminId = req.user.user_id;
    const { assignee_user_id } = req.body;

    await db.updateTicket(ticketId, {
      status_id: STATUS_ID.NEW,
      activated_at: now,
      activated_by_id: adminId,
      ...(assignee_user_id ? { assignee_user_id } : {})
    });

    await db.finaliseAiMetric(ticketId, ticket.category_id ?? null, assignee_user_id ?? ticket.assignee_user_id ?? null);
    await db.createStatusHistory(ticketId, STATUS_ID.DRAFT, STATUS_ID.NEW, adminId);

    const childTickets = await db.getChildTickets(ticketId, STATUS_ID.DRAFT);
    await activateChildTickets(childTickets, now, adminId, assignee_user_id);
    await addRequestCreatorsAsFollowers(ticketId, ticket.ticket_requests);

    const firstRequest = ticket.ticket_requests[0]?.request;
    if (firstRequest) {
      await emailService.sendStatusChangeEmail(firstRequest.email, ticketId, "New", firstRequest.tracking_id);
    }

    res.json({ message: "Draft ticket approved successfully", ticket_id: ticketId, new_status: "New" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message });
  }
};
