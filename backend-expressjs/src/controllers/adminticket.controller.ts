import { Request, Response } from "express";
import * as adminTicketService from "../services/adminticket.service";

export const listDrafts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const drafts = await adminTicketService.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch draft tickets" });
  }
};

export const updateDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const updateData = req.body;

    const updatedTicket = await adminTicketService.updateDraftTicket(
      ticketId,
      updateData
    );

    res.json(updatedTicket);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
};

export const approveDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const adminId = req.user?.user_id || 0;

    const result = await adminTicketService.approveDraft(ticketId, adminId);

    res.json(result);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
};

export const listActiveTickets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await adminTicketService.getActiveTickets();
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
