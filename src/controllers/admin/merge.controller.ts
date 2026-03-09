import { Request, Response } from "express";
import * as db from "../../repositories";

export const mergeTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentTicketId = Number.parseInt(req.params.id, 10);
    const { child_ticket_ids } = req.body;

    if (!Array.isArray(child_ticket_ids) || child_ticket_ids.length === 0) {
      res.status(400).json({ error: "child_ticket_ids must be a non-empty array" });
      return;
    }

    const parentTicket = await db.getTicketById(parentTicketId);
    if (!parentTicket) {
      res.status(404).json({ error: "Parent ticket not found" });
      return;
    }

    const merged = await db.mergeTickets(parentTicketId, child_ticket_ids);
    res.json({
      message: "Tickets merged successfully",
      parent_ticket_id: parentTicketId,
      merged_child_count: merged.length
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const unmergeTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const childTicketId = Number.parseInt(req.params.id, 10);

    const childTicket = await db.getTicketById(childTicketId);
    if (!childTicket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    await db.unmergeTicket(childTicketId);
    res.json({ message: "Ticket unmerged successfully", ticket_id: childTicketId });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const unlinkRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId  = Number.parseInt(req.params.ticketId,  10);
    const requestId = Number.parseInt(req.params.requestId, 10);

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }
    if (ticket.status?.name !== "Draft") {
      res.status(400).json({ error: "Can only unlink requests from Draft tickets" });
      return;
    }
    if (ticket.ticket_requests.length <= 1) {
      res.status(400).json({ error: "Cannot unlink the only request from a ticket" });
      return;
    }

    const linkedRequest = ticket.ticket_requests.find(
      (tr) => tr.request?.request_id === requestId
    );
    if (!linkedRequest?.request) {
      res.status(404).json({ error: "Request not linked to this ticket" });
      return;
    }

    await db.unlinkRequestFromTicket(ticketId, requestId);

    const newTicket = await db.createTicket(
      linkedRequest.request.message?.split("\n")[0].replace(/^Title:\s*/i, "").slice(0, 100) || "New Support Request",
      linkedRequest.request.message?.slice(0, 300) || "",
      ticket.category_id ?? 1,
      null
    );

    await db.linkRequestToTicket(newTicket.ticket_id, requestId);

    res.json({
      message: "Request unlinked successfully",
      new_ticket_id: newTicket.ticket_id,
      original_ticket_id: ticketId
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedMergesForTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const suggestions = await db.getSuggestedMergesForTicket(ticketId);
    res.json({ ticket_id: ticketId, suggested_merges: suggestions });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSuggestedMerges = async (_req: Request, res: Response): Promise<void> => {
  try {
    const suggestions = await db.getAllSuggestedMerges();
    res.json({ suggested_merges: suggestions });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getTicketConfidence = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const confidence = await db.getTicketConfidence(ticketId);
    if (!confidence) {
      res.status(404).json({ error: "No confidence data found for this ticket" });
      return;
    }

    res.json({ ticket_id: ticketId, confidence });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};
