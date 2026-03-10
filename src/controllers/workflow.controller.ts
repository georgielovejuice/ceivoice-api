import { Request, Response } from "express";
import * as db from "../repositories";
import * as emailService from "../services/email.service";
import { STATUS_ID, RESOLVED_STATUS_IDS } from "../constants/ticketStatus";

// ===== DRAFT ACTIVATION (Admin Only) =====
// Workflow: Draft → New (UAT-ADM-003)

export const activateDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const ticketId = Number.parseInt(req.params.id, 10);
    const adminId  = req.user.user_id;

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

    if (ticket.status_id !== STATUS_ID.DRAFT) {
      res.status(400).json({ error: "Only Draft tickets can be activated", current_status_id: ticket.status_id });
      return;
    }
    if (!ticket.title || !ticket.summary) {
      res.status(400).json({ error: "Ticket must have title and summary before activation" });
      return;
    }

    await db.updateTicket(ticketId, { status_id: STATUS_ID.NEW, activated_at: new Date(), activated_by_id: adminId });
    await db.createStatusHistory(ticketId, STATUS_ID.DRAFT, STATUS_ID.NEW, adminId, "Draft activated by Admin");

    for (const tr of ticket.ticket_requests ?? []) {
      if (tr.request) {
        await emailService.sendStatusChangeEmail(tr.request.email, ticketId, "New", tr.request.tracking_id);
      }
    }

    // In-app notification → assignee (assignment type)
    if (ticket.assignee_user_id) {
      db.createNotification(
        ticketId,
        ticket.assignee_user_id,
        "assignment",
        `New ticket assigned to you: ${ticket.title || `Ticket #${ticketId}`}`
      ).catch((err) => console.warn("Failed to create assignment notification:", err));
    }

    // In-app notification → USER followers only (admin made this change, no need to notify ADMIN/ASSIGNEE)
    db.getFollowers(ticketId).then((followers) => {
      const targets = followers.filter((f) => f.user?.role === "USER");
      return Promise.allSettled(
        targets.map((f) =>
          db.createNotification(
            ticketId,
            f.user_id,
            "status_change",
            `Ticket #${ticketId} is now active`
          ).catch((err) => console.warn("Failed to create status_change notification:", err))
        )
      );
    }).catch((err) => console.warn("Failed to fetch followers for activate notification:", err));

    res.json({ message: "Draft ticket activated successfully", ticket: { ticket_id: ticketId, status: "New", activated_at: new Date(), activated_by_id: adminId } });
  } catch (err) {
    console.error("Error activating draft:", err);
    res.status(500).json({ error: "Failed to activate draft ticket" });
  }
};

// ===== TICKET RESOLUTION (Assignee/Admin) =====
// Workflow: Any Status → Solved/Failed (UAT-WF-002)

export const resolveTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const ticketId = Number.parseInt(req.params.id, 10);
    const { resolution_status, resolution_comment } = req.body;
    const userId = req.user.user_id;

    if (!resolution_status || !["Solved", "Failed"].includes(resolution_status)) {
      res.status(400).json({ error: "resolution_status must be 'Solved' or 'Failed'" }); return;
    }
    if (!resolution_comment?.trim()) {
      res.status(400).json({ error: "resolution_comment is required when resolving a ticket" }); return;
    }

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

    if (ticket.status_id !== null && RESOLVED_STATUS_IDS.includes(ticket.status_id)) {
      res.status(400).json({ error: "Ticket is already resolved", current_status_id: ticket.status_id }); return;
    }

    const comment = await db.addComment(ticketId, userId, resolution_comment, false);
    const resolutionStatusId = resolution_status === "Solved" ? STATUS_ID.SOLVED : STATUS_ID.FAILED;

    await db.updateTicket(ticketId, { status_id: resolutionStatusId, resolved_at: new Date(), resolution_comment_id: comment.comment_id });
    await db.createStatusHistory(ticketId, ticket.status_id || STATUS_ID.DRAFT, resolutionStatusId, userId, `Ticket resolved as ${resolution_status}`);

    for (const tr of ticket.ticket_requests ?? []) {
      if (tr.request) {
        await emailService.sendStatusChangeEmail(tr.request.email, ticketId, resolution_status, tr.request.tracking_id);
      }
    }

    // In-app notifications → USER followers only (ADMIN/ASSIGNEE are the ones resolving)
    db.getFollowers(ticketId).then((followers) => {
      const targets = followers.filter((f) => f.user?.role === "USER");
      const notifyPromises = targets.map((f) =>
        db.createNotification(
          ticketId,
          f.user_id,
          "status_change",
          `Ticket #${ticketId} has been ${resolution_status}`
        ).catch((err) => console.warn("Failed to create status notification:", err))
      );
      return Promise.allSettled(notifyPromises);
    }).catch((err) => console.warn("Failed to fetch followers for resolve notification:", err));

    res.json({ message: `Ticket resolved as ${resolution_status}`, ticket: { ticket_id: ticketId, status: resolution_status, resolved_at: new Date(), resolution_comment_id: comment.comment_id } });
  } catch (err) {
    console.error("Error resolving ticket:", err);
    res.status(500).json({ error: "Failed to resolve ticket" });
  }
};

// ===== TICKET RENEWAL (Assignee/Admin) =====
// Workflow: Solved/Failed → Renew

export const renewTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const ticketId = Number.parseInt(req.params.id, 10);
    const { reason } = req.body;
    const userId = req.user.user_id;

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

    if (ticket.status_id === null || !RESOLVED_STATUS_IDS.includes(ticket.status_id)) {
      res.status(400).json({ error: "Only Solved or Failed tickets can be renewed", current_status_id: ticket.status_id }); return;
    }

    await db.updateTicket(ticketId, { status_id: STATUS_ID.RENEW, resolved_at: null, resolution_comment_id: null });
    await db.createStatusHistory(ticketId, ticket.status_id || STATUS_ID.DRAFT, STATUS_ID.RENEW, userId, reason || "Ticket reopened");

    if (reason) await db.addComment(ticketId, userId, `Ticket renewed: ${reason}`, true);

    // Email → requester(s)
    for (const tr of ticket.ticket_requests ?? []) {
      if (tr.request) {
        emailService.sendStatusChangeEmail(tr.request.email, ticketId, "Renew", tr.request.tracking_id)
          .catch((err) => console.warn("Failed to send renew status email:", err));
      }
    }

    // In-app notification → all followers, excluding the person making the change
    db.getFollowers(ticketId).then((followers) => {
      const targets = followers.filter((f) => f.user_id !== userId);
      return Promise.allSettled(
        targets.map((f) =>
          db.createNotification(
            ticketId,
            f.user_id,
            "status_change",
            `Ticket #${ticketId} has been renewed`
          ).catch((err) => console.warn("Failed to create renew notification:", err))
        )
      );
    }).catch((err) => console.warn("Failed to fetch followers for renew notification:", err));

    res.json({ message: "Ticket renewed successfully", ticket: { ticket_id: ticketId, status_id: STATUS_ID.RENEW, status: "Renew", previous_status_id: ticket.status_id } });
  } catch (err) {
    console.error("Error renewing ticket:", err);
    res.status(500).json({ error: "Failed to renew ticket" });
  }
};
