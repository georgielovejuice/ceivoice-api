import { Request, Response } from "express";
import type { UserProfile } from "../../types";
import * as db from "../../repositories";

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    const ticket = await db.getTicketById(ticketId);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyTickets = async (req: any, res: Response): Promise<void> => {
  try {
    // Returns tickets with ticket_requests.request.message included for original message access
    const tickets = await db.getTicketsByCreator(req.user.user_id);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAssignedTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = (req.user as UserProfile).user_id;
    const resolved = req.query.resolved === "true";
    const tickets = resolved
      ? await db.getResolvedTicketsByAssignee(userId)
      : await db.getTicketsByAssignee(userId);

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listAssignees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignees = await db.getAllAssignees();
    res.json(assignees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTicketsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;

    if (!status) {
      res.status(400).json({ error: "Status parameter required" });
      return;
    }

    const statusMap: Record<string, number> = {
      Draft: 1, New: 2, Assigned: 3, Solving: 4, Solved: 5, Failed: 6, Renew: 7
    };
    const statusId = statusMap[status];

    if (!statusId) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    const tickets = await db.getTicketsByStatus(statusId);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
