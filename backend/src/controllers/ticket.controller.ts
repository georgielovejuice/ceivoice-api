import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";
import * as aiService from "../services/ai.service";

// ===== DRAFT TICKETS =====

export const getDraftTickets = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const drafts = await dbService.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editDraftTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, summary, category_id, suggested_solution } = req.body;
    const ticketId = parseInt(id);

    // Get current ticket
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    if (ticket.status !== "Draft") {
      res.status(400).json({ error: "Only draft tickets can be edited" });
      return;
    }

    // Validate title length
    if (title && title.length > 100) {
      res.status(400).json({ error: "Title must be less than 100 characters" });
      return;
    }

    // Validate summary length
    if (summary && summary.length > 500) {
      res.status(400).json({
        error: "Summary must be less than 500 characters"
      });
      return;
    }

    // Update ticket
    const updatedTicket = await dbService.updateTicket(ticketId, {
      title: title || ticket.title,
      summary: summary || ticket.summary,
      category_id: category_id || ticket.category_id,
      suggested_solution: suggested_solution || ticket.suggested_solution
    });

    res.json({
      message: "Draft ticket updated successfully",
      ticket: updatedTicket
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setDeadline = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { deadline } = req.body;
    const ticketId = parseInt(id);

    if (!deadline) {
      res.status(400).json({ error: "Deadline is required" });
      return;
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      res.status(400).json({ error: "Invalid deadline format" });
      return;
    }

    const ticket = await dbService.updateTicket(ticketId, {
      deadline: deadlineDate
    });

    res.json({
      message: "Deadline set successfully",
      ticket
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== TICKET STATUS UPDATES =====

export const updateStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const oldStatus = ticket.status;

    // Update ticket status
    await dbService.updateTicket(ticketId, { status: new_status });

    // Record status history
    await dbService.createStatusHistory(
      ticketId,
      oldStatus,
      new_status,
      req.user.user_id
    );

    // Send email notification if status changed
    if (oldStatus !== new_status && ticket.ticket_requests.length > 0) {
      const request = ticket.ticket_requests[0]?.request;
      if (request) {
        await emailService.sendStatusChangeEmail(
          request.email,
          ticketId,
          new_status,
          request.tracking_id
        );
      }
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message || "Failed to update status" });
  }
};

// ===== TICKET RETRIEVAL =====

export const getTicketById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = await dbService.getTicketById(ticketId);

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

export const getTicketsByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.query;

    if (!status) {
      res.status(400).json({ error: "Status query parameter required" });
      return;
    }

    const tickets = await dbService.getTicketsByStatus(status as string);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== ASSIGNMENTS =====

export const assignTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { assignee_id } = req.body;

    if (!assignee_id) {
      res.status(400).json({ error: "assignee_id required" });
      return;
    }

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    const oldAssigneeId = ticket.assignments[0]?.assignee_id || null;
    await dbService.assignTicket(ticketId, assignee_id);
    await dbService.createAssignmentHistory(ticketId, oldAssigneeId, assignee_id);

    // Update ticket status to Assigned
    await dbService.updateTicket(ticketId, { status: "Assigned" });

    res.json({ message: "Ticket assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unassignTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { assignee_id } = req.body;

    if (!assignee_id) {
      res.status(400).json({ error: "assignee_id required" });
      return;
    }

    await dbService.unassignTicket(ticketId, assignee_id);
    res.json({ message: "Ticket unassigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== COMMENTS =====

export const addComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    const { content, is_internal } = req.body;

    if (!content) {
      res.status(400).json({ error: "Comment content required" });
      return;
    }

    const comment = await dbService.addComment(
      ticketId,
      req.user.user_id,
      content,
      is_internal || false
    );

    res.status(201).json({
      message: "Comment added successfully",
      comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const isPublic = req.query.public === "true";

    let comments;
    if (isPublic) {
      comments = await dbService.getPublicComments(ticketId);
    } else {
      comments = await dbService.getTicketComments(ticketId);
    }

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== FOLLOWERS =====

export const addFollower = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = parseInt(req.params.id, 10);
    await dbService.addFollower(ticketId, req.user.user_id);

    res.json({ message: "Follower added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const followers = await dbService.getFollowers(ticketId);
    res.json(followers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
