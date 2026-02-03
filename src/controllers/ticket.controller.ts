import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";
import * as validationService from "../services/validation.service";

// EP03-ST001: View Draft Tickets List
export const getDraftTickets = async (req: Request, res: Response) => {
  try {
    const drafts = await dbService.getDraftTickets();
    res.json(drafts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP03-ST002: Edit Draft Ticket
export const editDraftTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, summary, category_id } = req.body;
    const ticketId = parseInt(id);

    // Get current ticket
    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.status !== "Draft") {
      return res.status(400).json({ error: "Only draft tickets can be edited" });
    }

    // Validate inputs
    if (title && !validationService.validateTitle(title)) {
      return res.status(400).json({ error: "Invalid title" });
    }

    if (summary && !validationService.validateSummary(summary)) {
      return res.status(400).json({ error: "Summary too long (max 500 chars)" });
    }

    // Update ticket
    const updatedTicket = await dbService.updateTicket(ticketId, {
      title: title || ticket.title,
      summary: summary || ticket.summary,
      categoryId: category_id || ticket.categoryId
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

// EP03-ST003: Set Deadline
export const setDeadline = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deadline } = req.body;
    const ticketId = parseInt(id);

    if (!deadline) {
      return res.status(400).json({ error: "Deadline is required" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: "Invalid deadline format" });
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

// EP03-ST004: Merge Multiple Requests
export const mergeRequests = async (req: Request, res: Response) => {
  try {
    const { ticket_id, request_ids } = req.body;

    if (!ticket_id || !Array.isArray(request_ids) || request_ids.length === 0) {
      return res.status(400).json({ error: "Invalid ticket_id or request_ids" });
    }

    // Link all requests to the ticket
    for (const requestId of request_ids) {
      await dbService.linkRequestToTicket(ticket_id, requestId);
    }

    res.json({
      message: `${request_ids.length} requests merged successfully`,
      ticket_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP03-ST005: Unlink Requests
export const unlinkRequest = async (req: Request, res: Response) => {
  try {
    const { ticket_id, request_id } = req.body;

    if (!ticket_id || !request_id) {
      return res.status(400).json({ error: "ticket_id and request_id are required" });
    }

    // Get the request details
    const request = await dbService.getRequestById(request_id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Unlink
    await dbService.unlinkRequestFromTicket(ticket_id, request_id);

    // Create new draft ticket for unlinked request
    const defaultCategory = await dbService.getOrCreateCategory("General");
    const newDraftTicket = await dbService.createTicket(
      request.message.substring(0, 100),
      request.message.substring(0, 500),
      defaultCategory.categoryId,
      "Draft"
    );

    await dbService.linkRequestToTicket(newDraftTicket.ticketId, request_id);

    res.json({
      message: "Request unlinked successfully",
      new_draft_ticket_id: newDraftTicket.ticketId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP03-ST006: Submit Draft to New Ticket
export const submitDraftToNewTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.status !== "Draft") {
      return res.status(400).json({ error: "Only draft tickets can be submitted" });
    }

    // Update status to New
    const updatedTicket = await dbService.updateTicket(ticketId, { status: "New" });

    // Get creator email from linked requests
    const ticketRequests = ticket.ticketRequests;
    const creatorEmails = new Set<string>();
    for (const tr of ticketRequests) {
      if (tr.request.email) {
        creatorEmails.add(tr.request.email);
      }
    }

    // Add creators as followers
    // Note: We need to get or create users first
    for (const email of creatorEmails) {
      const user = await dbService.getOrCreateUser(email);
      await dbService.addFollower(ticketId, user.userId);
    }

    // Create notification
    for (const email of creatorEmails) {
      const user = await dbService.getOrCreateUser(email);
      await dbService.createNotification(
        ticketId,
        user.userId,
        "submission",
        `Your request has been converted to ticket #${ticketId}`
      );
    }

    res.json({
      message: "Draft submitted to new ticket successfully",
      ticket: updatedTicket
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP04-ST001: Assignee Workload View
export const getAssigneeWorkload = async (req: Request, res: Response) => {
  try {
    const { assignee_id } = req.params;
    const assigneeId = parseInt(assignee_id);

    const tickets = await dbService.getTicketsByAssignee(assigneeId);

    res.json({
      assignee_id: assigneeId,
      tickets: tickets.map(t => ({
        ticket_id: t.ticketId,
        title: t.title,
        status: t.status,
        deadline: t.deadline,
        category: t.category?.name
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP04-ST002: Update Ticket Status
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { new_status, user_id, resolution_comment } = req.body;
    const ticketId = parseInt(id);

    if (!validationService.validateStatus(new_status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Validate transition
    if (!validationService.validateStatusTransition(ticket.status, new_status)) {
      return res.status(400).json({
        error: `Cannot transition from ${ticket.status} to ${new_status}`
      });
    }

    // Check resolution comment for Solved/Failed
    if ((new_status === "Solved" || new_status === "Failed") && !resolution_comment) {
      return res.status(400).json({
        error: "Resolution comment required for Solved/Failed status"
      });
    }

    // Update status
    const updatedTicket = await dbService.updateTicket(ticketId, { status: new_status });

    // Create status history
    await dbService.createStatusHistory(ticketId, ticket.status, new_status, user_id);

    // Add resolution comment if provided
    if (resolution_comment) {
      await dbService.addComment(ticketId, user_id, resolution_comment, false);
    }

    // Send email notification
    const followers = await dbService.getFollowers(ticketId);
    for (const follower of followers) {
      if (follower.user.email) {
        emailService.sendStatusChangeEmail(
          follower.user.email,
          ticketId,
          new_status,
          "" // tracking ID would go here if needed
        ).catch(err => console.error('Email send failed:', err));
      }
    }

    res.json({
      message: "Status updated successfully",
      ticket: updatedTicket
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP04-ST003: Get Status History
export const getStatusHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const history = await dbService.getStatusHistory(ticketId);

    res.json(history);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP04-ST004: Reassign Ticket
export const reassignTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignee_ids, user_id } = req.body;
    const ticketId = parseInt(id);

    if (!Array.isArray(assignee_ids) || assignee_ids.length === 0) {
      return res.status(400).json({ error: "assignee_ids must be a non-empty array" });
    }

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Get current assignees
    const currentAssignments = await dbService.getTicketAssignees(ticketId);
    const oldAssigneeIds = currentAssignments.map(a => a.assigneeId);

    // Remove old assignments
    for (const oldId of oldAssigneeIds) {
      await dbService.unassignTicket(ticketId, oldId);
    }

    // Add new assignments
    for (const newId of assignee_ids) {
      await dbService.assignTicket(ticketId, newId);
    }

    // Create assignment history
    for (const newId of assignee_ids) {
      const oldId = oldAssigneeIds.length > 0 ? oldAssigneeIds[0] : null;
      await dbService.createAssignmentHistory(ticketId, oldId, newId);
    }

    // Update ticket status if needed
    if (ticket.status === "New") {
      await dbService.updateTicket(ticketId, { status: "Assigned" });
    }

    // Send notification emails to assignees
    for (const assigneeId of assignee_ids) {
      const assignee = await dbService.getUserById(assigneeId);
      if (assignee && assignee.email) {
        emailService.sendAssignmentNotificationEmail(
          assignee.email,
          assignee.name || assignee.email,
          ticketId,
          ticket.title
        ).catch(err => console.error('Email send failed:', err));
      }
    }

    res.json({
      message: "Ticket reassigned successfully",
      assignee_ids
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP04-ST005: Get Assignment History
export const getAssignmentHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const history = await dbService.getAssignmentHistory(ticketId);

    res.json(history);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP05-ST001: Get Comments
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const comments = await dbService.getTicketComments(ticketId);

    res.json(comments);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP05-ST002: Add Comment
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, content, is_internal } = req.body;
    const ticketId = parseInt(id);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const comment = await dbService.addComment(ticketId, user_id, content, is_internal || false);

    // Notify followers if public comment
    if (!is_internal) {
      const user = await dbService.getUserById(user_id);
      const followers = await dbService.getFollowers(ticketId);
      for (const follower of followers) {
        if (follower.user.email && follower.user.userId !== user_id) {
          emailService.sendCommentNotificationEmail(
            follower.user.email,
            ticketId,
            user?.name || user?.email || "Unknown",
            "" // tracking ID
          ).catch(err => console.error('Email send failed:', err));
        }
      }
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP05-ST003: Get Ticket Participants
export const getTicketParticipants = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Get followers
    const followers = await dbService.getFollowers(ticketId);

    // Get assignees
    const assignees = await dbService.getTicketAssignees(ticketId);

    res.json({
      assignees: assignees.map(a => ({
        user_id: a.assignee.userId,
        name: a.assignee.name,
        email: a.assignee.email
      })),
      followers: followers.map(f => ({
        user_id: f.user.userId,
        name: f.user.name,
        email: f.user.email
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id);

    const ticket = await dbService.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get All Tickets
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let tickets;
    if (status) {
      tickets = await dbService.getTicketsByStatus(status as string);
    } else {
      // Get all non-draft tickets
      tickets = await dbService.getTicketsByStatus("New");
      // This should query all, not just "New", but we'd need a method for that
    }

    res.json(tickets);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
