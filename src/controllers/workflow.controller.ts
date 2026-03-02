import { Request, Response } from "express";
import type { UserProfile } from "../types";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";

// ===== DRAFT ACTIVATION (Admin Only) =====
// Workflow: Draft → New (UAT-ADM-003)

export const activateDraft = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const adminId = (req.user as UserProfile).user_id;

    // Get ticket and verify it's in Draft status
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.status_id !== 1) { // 1 = Draft
      res.status(400).json({
        error: "Only Draft tickets can be activated",
        current_status_id: ticket.status_id
      });
      return;
    }

    // Validate required fields before activation
    if (!ticket.title || !ticket.summary) {
      res.status(400).json({
        error: "Ticket must have title and summary before activation"
      });
      return;
    }

    // Update ticket to New status (status_id: 2) with activation metadata
    await dbService.updateTicket(ticketId, {
      status_id: 2, // New
      activated_at: new Date(),
      activated_by_id: adminId
    });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      1, // Old status: Draft
      2, // New status: New
      adminId,
      "Draft activated by Admin"
    );

    // Send confirmation email to all users who submitted this request
    if (ticket.ticket_requests && ticket.ticket_requests.length > 0) {
      for (const tr of ticket.ticket_requests) {
        const request = tr.request;
        if (request) {
          await emailService.sendStatusChangeEmail(
            request.email,
            ticketId,
            "New",
            request.tracking_id
          );
        }
      }
    }

    res.json({
      message: "Draft ticket activated successfully",
      ticket: {
        ticket_id: ticketId,
        status: "New",
        activated_at: new Date(),
        activated_by_id: adminId
      }
    });
  } catch (err) {
    console.error("Error activating draft:", err);
    res.status(500).json({ error: "Failed to activate draft ticket" });
  }
};

// ===== TICKET RESOLUTION (Assignee/Admin) =====
// Workflow: Any Status → Solved/Failed (UAT-WF-002)
// Requires resolution comment

export const resolveTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { resolution_status, resolution_comment } = req.body;
    const userId = (req.user as UserProfile).user_id;

    // Validate inputs
    if (!resolution_status || !["Solved", "Failed"].includes(resolution_status)) {
      res.status(400).json({
        error: "resolution_status must be 'Solved' or 'Failed'"
      });
      return;
    }

    if (!resolution_comment || resolution_comment.trim().length === 0) {
      res.status(400).json({
        error: "resolution_comment is required when resolving a ticket"
      });
      return;
    }

    // Get ticket
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Prevent re-resolving already resolved tickets
    if ([5, 6].includes(ticket.status_id || 0)) { // 5 = Solved, 6 = Failed
      res.status(400).json({
        error: "Ticket is already resolved",
        current_status_id: ticket.status_id
      });
      return;
    }

    // Create resolution comment (always public for user visibility)
    const comment = await dbService.addComment(
      ticketId,
      userId,
      resolution_comment,
      false // is_internal = false (public)
    );

    // Map resolution status string to ID
    const statusIdMap: Record<string, number> = { "Solved": 5, "Failed": 6 };
    const resolutionStatusId = statusIdMap[resolution_status];

    // Update ticket with resolution
    await dbService.updateTicket(ticketId, {
      status_id: resolutionStatusId,
      resolved_at: new Date(),
      resolution_comment_id: comment.comment_id
    });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      ticket.status_id || 1,
      resolutionStatusId,
      userId,
      `Ticket resolved as ${resolution_status}`
    );

    // Send final status email to all requesters
    if (ticket.ticket_requests && ticket.ticket_requests.length > 0) {
      for (const tr of ticket.ticket_requests) {
        const request = tr.request;
        if (request) {
          await emailService.sendStatusChangeEmail(
            request.email,
            ticketId,
            resolution_status,
            request.tracking_id
          );
        }
      }
    }

    res.json({
      message: `Ticket resolved as ${resolution_status}`,
      ticket: {
        ticket_id: ticketId,
        status: resolution_status,
        resolved_at: new Date(),
        resolution_comment_id: comment.comment_id
      }
    });
  } catch (err) {
    console.error("Error resolving ticket:", err);
    res.status(500).json({ error: "Failed to resolve ticket" });
  }
};

// ===== TICKET RENEWAL (Assignee/Admin) =====
// Workflow: Solved/Failed → Renew (reopen ticket)

export const renewTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { reason } = req.body;
    const userId = (req.user as UserProfile).user_id;

    // Get ticket
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Only allow renewal of resolved tickets
    if (![5, 6].includes(ticket.status_id || 0)) { // 5 = Solved, 6 = Failed
      res.status(400).json({
        error: "Only Solved or Failed tickets can be renewed",
        current_status_id: ticket.status_id
      });
      return;
    }

    // Update ticket status to Renew (status_id: 7)
    await dbService.updateTicket(ticketId, {
      status_id: 7, // Renew
      resolved_at: null, // Clear resolution timestamp
      resolution_comment_id: null // Clear resolution comment link
    });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      ticket.status_id || 1,
      7, // Renew
      userId,
      reason || "Ticket reopened"
    );

    // Optionally create an internal comment
    if (reason) {
      await dbService.addComment(
        ticketId,
        userId,
        `Ticket renewed: ${reason}`,
        true // internal comment
      );
    }

    res.json({
      message: "Ticket renewed successfully",
      ticket: {
        ticket_id: ticketId,
        status_id: 7, // Renew
        status: "Renew",
        previous_status_id: ticket.status_id
      }
    });
  } catch (err) {
    console.error("Error renewing ticket:", err);
    res.status(500).json({ error: "Failed to renew ticket" });
  }
};
