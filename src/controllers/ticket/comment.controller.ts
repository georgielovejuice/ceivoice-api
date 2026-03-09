import { Request, Response } from "express";
import type { UserProfile } from "../../types";
import * as db from "../../repositories";
import * as emailService from "../../services/email.service";

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId  = Number.parseInt(req.params.id, 10);
    const { content, is_internal } = req.body;

    if (!content) {
      res.status(400).json({ error: "Comment content required" });
      return;
    }

    const comment = await db.addComment(
      ticketId,
      (req.user as UserProfile).user_id,
      content,
      is_internal || false
    );

    // Send email notification for public comments
    if (!is_internal) {
      try {
        const ticket = await db.getTicketById(ticketId);
        const commenterEmail = (req.user as UserProfile).email || "Support Team";

        if (ticket && ticket.ticket_requests && ticket.ticket_requests.length > 0) {
          const request = ticket.ticket_requests[0]?.request;
          if (request) {
            await emailService.sendCommentNotificationEmail(
              request.email, ticketId, commenterEmail, request.tracking_id
            ).catch((err) => console.warn("Failed to send comment notification email:", err));
          }
        }
      } catch (err) {
        console.warn("Error processing comment notification:", err);
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    const isPublic = req.query.public === "true";

    const comments = isPublic
      ? await db.getPublicComments(ticketId)
      : await db.getTicketComments(ticketId);

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTicketHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);

    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const [statusHistory, assignmentHistory] = await Promise.all([
      db.getStatusHistory(ticketId),
      db.getAssignmentHistory(ticketId)
    ]);

    const timeline: any[] = [
      ...statusHistory.map((sh) => ({
        type:          "status_change",
        timestamp:     sh.changed_at,
        old_status:    sh.old_status?.name ?? null,
        new_status:    sh.new_status?.name ?? null,
        changed_by:    sh.changed_by
          ? { user_id: sh.changed_by.user_id, name: sh.changed_by.full_name ?? sh.changed_by.user_name ?? sh.changed_by.email }
          : null,
        change_reason: sh.change_reason ?? null
      })),
      ...assignmentHistory.map((ah) => ({
        type:         "assignment_change",
        timestamp:    ah.changed_at,
        old_assignee: ah.old_assignee
          ? { user_id: ah.old_assignee.user_id, name: ah.old_assignee.full_name ?? ah.old_assignee.user_name ?? ah.old_assignee.email }
          : null,
        new_assignee: ah.new_assignee
          ? { user_id: ah.new_assignee.user_id, name: ah.new_assignee.full_name ?? ah.new_assignee.user_name ?? ah.new_assignee.email }
          : null,
        changed_by:   ah.changed_by
          ? { user_id: ah.changed_by.user_id, name: ah.changed_by.full_name ?? ah.changed_by.user_name ?? ah.changed_by.email }
          : null,
        change_reason: ah.change_reason ?? null
      }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({ ticket_id: ticketId, history: timeline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ticket history" });
  }
};
