import { Request, Response } from "express";
import type { UserProfile } from "../types";
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

    if (ticket.status_id !== 1) { // 1 = Draft
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

    if (ticket.status_id !== 1) { // 1 = Draft
      res.status(400).json({ error: "Only draft tickets can be approved" });
      return;
    }

    // Get the status IDs for Draft (1) and New (2)
    const draftStatusId = 1;
    const newStatusId = 2;

    // Update status to New (2)
    await dbService.updateTicket(ticketId, { status_id: newStatusId });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      draftStatusId,
      newStatusId,
      (req.user as UserProfile).user_id
    );

    // Auto-add request creators as followers (EP03-ST006)
    if (ticket.ticket_requests && ticket.ticket_requests.length > 0) {
      for (const tr of ticket.ticket_requests) {
        const request = tr.request;
        if (request && request.email) {
          try {
            // Find user by email and add as follower
            const user = await dbService.getUserByEmail(request.email);
            if (user) {
              await dbService.addFollower(ticketId, user.user_id);
            }
          } catch (err) {
            console.warn(`Failed to add follower for ${request.email}:`, err);
            // Continue - follower not critical, email notification is primary
          }
        }
      }
    }

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

// ===== CATEGORIES =====

export const listCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await dbService.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// ===== ALL TICKETS =====

export const listAllTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const tickets = await dbService.getAllTickets();
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
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

    const tickets = await dbService.getTicketsByStatus(2); // 2 = New
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

    const oldAssigneeId = ticket.assignee_user_id || null;
    await dbService.assignTicket(ticketId, assignee_id);
    await dbService.createAssignmentHistory(
      ticketId,
      oldAssigneeId,
      assignee_id,
      (req.user as UserProfile).user_id
    );

    // Update status if not already assigned
    const assignedStatusId = 3; // 3 = Assigned
    if (ticket.status_id === 2) { // If status is New (2)
      await dbService.updateTicket(ticketId, { status_id: assignedStatusId });
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
// ===== MERGE/UNMERGE TICKETS =====

export const mergeTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const parentTicketId = parseInt(req.params.id, 10);
    const { child_ticket_ids } = req.body;

    if (!Array.isArray(child_ticket_ids) || child_ticket_ids.length === 0) {
      res.status(400).json({ error: "child_ticket_ids must be a non-empty array" });
      return;
    }

    // Get parent ticket
    const parentTicket = await dbService.getTicketById(parentTicketId);
    if (!parentTicket) {
      res.status(404).json({ error: "Parent ticket not found" });
      return;
    }

    // Merge child tickets
    const merged = await dbService.mergeTickets(parentTicketId, child_ticket_ids);

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

export const unmergeTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const childTicketId = parseInt(req.params.id, 10);

    // Get child ticket
    const childTicket = await dbService.getTicketById(childTicketId);
    if (!childTicket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    // Unmerge
    await dbService.unmergeTicket(childTicketId);

    res.json({
      message: "Ticket unmerged successfully",
      ticket_id: childTicketId
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

// ===== USER ROLE MANAGEMENT =====

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const userId = parseInt(req.params.userId, 10);
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: "Role is required" });
      return;
    }

    // Validate role value
    const validRoles = ["ADMIN", "ASSIGNEE", "USER"];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}`
      });
      return;
    }

    // Get user and verify exists
    const user = await dbService.getUserById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update user role (EP06-ST001)
    const updatedUser = await dbService.updateUserRole(userId, role);

    res.json({
      message: "User role updated successfully",
      user_id: updatedUser.user_id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      role: updatedUser.role
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

// ===== ASSIGNEE SCOPE MANAGEMENT =====

export const getAssigneeScopes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const assigneeId = parseInt(req.params.assigneeId, 10);

    // Verify assignee exists
    const assignee = await dbService.getUserById(assigneeId);
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found" });
      return;
    }

    // Get all scopes for assignee (EP06-ST002)
    const scopes = await dbService.getAssigneeScopes(assigneeId);

    res.json({
      message: "Assignee scopes retrieved successfully",
      assignee_id: assigneeId,
      scopes: scopes
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const addAssigneeScope = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const assigneeId = parseInt(req.params.assigneeId, 10);
    const { scope_name } = req.body;

    if (!scope_name) {
      res.status(400).json({ error: "scope_name is required" });
      return;
    }

    // Validate scope_name
    if (typeof scope_name !== "string" || scope_name.trim().length === 0) {
      res.status(400).json({ error: "scope_name must be a non-empty string" });
      return;
    }

    // Verify assignee exists
    const assignee = await dbService.getUserById(assigneeId);
    if (!assignee) {
      res.status(404).json({ error: "Assignee not found" });
      return;
    }

    // Add scope to assignee (EP06-ST002)
    const scope = await dbService.assignScope(assigneeId, scope_name.trim());

    res.status(201).json({
      message: "Scope added to assignee successfully",
      scope: scope
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const removeAssigneeScope = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
      res.status(403).json({ error: "Forbidden - Admin access required" });
      return;
    }

    const scopeId = parseInt(req.params.scopeId, 10);

    // Remove scope (EP06-ST002)
    await dbService.removeScopeById(scopeId);

    res.json({
      message: "Scope removed successfully",
      scope_id: scopeId
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    
    // Handle "not found" error
    if (error.message && error.message.includes("not found")) {
      res.status(404).json({ error: "Scope not found" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};