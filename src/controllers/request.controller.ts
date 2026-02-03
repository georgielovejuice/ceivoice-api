import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";
import * as validationService from "../services/validation.service";

// EP01-ST001: Submit Request Form
export const submitRequest = async (req: Request, res: Response) => {
  try {
    const { email, message } = req.body;

    // Validation
    if (!validationService.validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validationService.validateMessage(message)) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Create request
    const request = await dbService.createRequest(email, message);

    // Get or create default category
    const defaultCategory = await dbService.getOrCreateCategory("General");

    // Create draft ticket (no AI in this version)
    const ticket = await dbService.createTicket(
      message.substring(0, 100),
      message.substring(0, 500),
      defaultCategory.categoryId,
      "Draft"
    );

    // Link request to ticket
    await dbService.linkRequestToTicket(ticket.ticketId, request.requestId);

    // Send confirmation email (async, don't wait)
    emailService.sendConfirmationEmail(email, request.trackingId, ticket.ticketId).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.status(201).json({
      message: "Request submitted successfully",
      ticket_id: ticket.ticketId,
      tracking_id: request.trackingId,
      status: "Draft"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP01-ST003: Track Ticket Status
export const trackRequest = async (req: Request, res: Response) => {
  try {
    const { tracking_id } = req.params;

    if (!tracking_id) {
      return res.status(400).json({ error: "Tracking ID is required" });
    }

    const request = await dbService.getRequestByTrackingId(tracking_id);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Get ticket details
    const ticketIds = request.ticketRequests.map(tr => tr.ticketId);
    if (ticketIds.length === 0) {
      return res.status(404).json({ error: "No associated ticket found" });
    }

    const ticket = await dbService.getTicketById(ticketIds[0]);

    res.json({
      request: {
        request_id: request.requestId,
        email: request.email,
        created_at: request.createdAt
      },
      ticket: {
        ticket_id: ticket?.ticketId,
        title: ticket?.title,
        status: ticket?.status,
        summary: ticket?.summary,
        updated_at: ticket?.updatedAt,
        comments: ticket?.comments.filter(c => !c.isInternal) || []
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP01-ST001: Get all requests (admin)
export const getAllRequests = async (req: Request, res: Response) => {
  try {
    // Get all requests with pagination in production
    // For now, return a message to implement pagination
    res.json({
      message: "Pagination not implemented - use /api/requests/track/:tracking_id to get request details",
      endpoint: "GET /api/requests/track/:tracking_id"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
