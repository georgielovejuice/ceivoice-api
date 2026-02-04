import { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";
import { TicketStatus, UserRole } from "../constants/ticketStatus";

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { new_status } = req.body;

    if (!new_status) {
      res.status(400).json({ error: "new_status required" });
      return;
    }

    const newStatus = new_status.toUpperCase() as TicketStatus;

    // Validate the status
    if (!Object.values(TicketStatus).includes(newStatus)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    await ticketService.changeTicketStatus({
      ticketId,
      newStatus,
      changedBy: req.user.user_id,
      userRole: req.user.role as UserRole
    });

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
};
