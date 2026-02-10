import { Request, Response } from "express";
import type { UserProfile } from "../config/passport";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";

// ===== DRAFT MANAGEMENT =====

export const listDrafts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const drafts = await dbService.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch draft tickets" });
  }
};

export const updateDraft = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { title, summary, suggested_solution, category_id, deadline } =
      req.body;

    // Validate ticket exists and is draft
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.status !== "Draft") {
      res.status(400).json({ error: "Only draft tickets can be updated" });
      return;
    }

    // Validate inputs
    if (title && title.length > 100) {
      res.status(400).json({ error: "Title must be less than 100 characters" });
      return;
    }

    if (summary && summary.length > 500) {
      res.status(400).json({
        error: "Summary must be less than 500 characters"
      });
      return;
    }

    // Update ticket
    const updateData: any = {};
    if (title) updateData.title = title;
    if (summary) updateData.summary = summary;
    if (suggested_solution) updateData.suggested_solution = suggested_solution;
    if (category_id) updateData.category_id = category_id;
    if (deadline) updateData.deadline = new Date(deadline);

    const updatedTicket = await dbService.updateTicket(ticketId, updateData);

    res.json({
      message: "Draft ticket updated successfully",
      ticket: updatedTicket
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message });
  }
};

export const approveDraft = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);

    // Get ticket
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.status !== "Draft") {
      res.status(400).json({ error: "Only draft tickets can be approved" });
      return;
    }

    // Update status to "New"
    const oldStatus = ticket.status;
    await dbService.updateTicket(ticketId, { status: "New" });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      oldStatus,
      "New",
      (req.user as UserProfile).user_id
    );

    // Send notification emails to associated users
    if (ticket.ticket_requests.length > 0) {
      const request = ticket.ticket_requests[0]?.request;
      if (request) {
        await emailService.sendStatusChangeEmail(
          request.email,
          ticketId,
          "New",
          request.tracking_id
        );
      }
    }

    res.json({
      message: "Draft ticket approved successfully",
      ticket_id: ticketId,
      new_status: "New"
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message });
  }
};

// ===== ACTIVE TICKETS =====

export const listActiveTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const tickets = await dbService.getTicketsByStatus("New");
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== TICKET ASSIGNMENT MANAGEMENT =====

export const assignTicketToUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { assignee_id } = req.body;

    if (!assignee_id) {
      res.status(400).json({ error: "assignee_id is required" });
      return;
    }

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const oldAssigneeId = ticket.assignments[0]?.assignee_id || null;
    await dbService.assignTicket(ticketId, assignee_id);
    await dbService.createAssignmentHistory(
      ticketId,
      oldAssigneeId,
      assignee_id
    );

    // Update status if not already assigned
    if (ticket.status === "New") {
      await dbService.updateTicket(ticketId, { status: "Assigned" });
    }

    res.json({ message: "Ticket assigned successfully" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getAssigneeList = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const assignees = await dbService.getAllAssignees();
    res.json(assignees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== STATISTICS =====

export const getTicketStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const { startDate, endDate } = req.query;

    const stats = await dbService.getTicketStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

// ===== NOTIFICATIONS =====

export const getUserNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notifications = await dbService.getUserNotifications(
      (req.user as UserProfile).user_id
    );
    res.json(notifications);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notificationId = parseInt(req.params.id, 10);
    await dbService.markNotificationAsRead(notificationId);

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};
