import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import type { UserProfile } from "../config/passport";
import * as emailService from "../services/email.service";
import { aiService } from "../services/ai.service";
import * as validator from "email-validator";

// ===== SUBMIT REQUEST =====

export const submitRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, message } = req.body;

    // Validation
    if (!email || !validator.validate(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (!message || message.trim().length === 0) {
      res.status(400).json({ error: "Message cannot be empty" });
      return;
    }

    if (message.length > 5000) {
      res.status(400).json({ error: "Message is too long (max 5000 characters)" });
      return;
    }

    // 1. Create the Raw Request first
    const request = await dbService.createRequest(email, message);

    // 2. Prepare Context for AI
    const allCategories = await dbService.getAllActiveCategories();
    const categoryNames = allCategories.map((c) => c.name);

    // NEW: Get Agents for AI to choose from
    const allAgents = await dbService.getAllAssignees();

    // 3. Generate Draft using Local AI (Now passing agents too)
    const aiDraft = await aiService.generateDraft(message, categoryNames, allAgents);

    // 4. Resolve the AI's chosen Category Name to an ID
    let selectedCategoryId = allCategories.find(
      (c) => c.name === aiDraft.category,
    )?.category_id;

    if (!selectedCategoryId) {
      const defaultCategory = await dbService.getOrCreateCategory("General");
      selectedCategoryId = defaultCategory.category_id;
    }

    // 5. Create the Ticket Draft
    const ticket = await dbService.createTicket(
      aiDraft.title,
      aiDraft.summary,
      selectedCategoryId,
      1, // Creator: System User
    );

    // 6. Update Ticket with AI specifics
    const solutionText = Array.isArray(aiDraft.suggested_solution)
      ? "- " + aiDraft.suggested_solution.join("\n- ")
      : aiDraft.suggested_solution;

    await dbService.updateTicket(ticket.ticket_id, {
      suggested_solution: solutionText,
      priority: aiDraft.priority,
      assignee_user_id: aiDraft.assignee_id // <--- SAVE ASSIGNEE
    });

    // Link request to ticket
    await dbService.linkRequestToTicket(ticket.ticket_id, request.request_id);

    // Send confirmation email
    emailService
      .sendConfirmationEmail(email, request.tracking_id, ticket.ticket_id)
      .catch((err) => {
        console.error("Failed to send confirmation email:", err);
      });

    res.status(201).json({
      message: "Request submitted successfully",
      ticket_id: ticket.ticket_id,
      tracking_id: request.tracking_id,
      status: "Draft",
      ai_analysis: {
        category: aiDraft.category,
        priority: aiDraft.priority,
        assigned_to: aiDraft.assignee_id // Optional: Show who got assigned
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ===== TRACK REQUEST =====

export const trackRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { tracking_id } = req.params;

    if (!tracking_id) {
      res.status(400).json({ error: "Tracking ID is required" });
      return;
    }

    const request = await dbService.getRequestByTrackingId(tracking_id);

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const ticketIds = request.ticket_requests.map((tr) => tr.ticket_id);
    if (ticketIds.length === 0) {
      res.status(404).json({ error: "No associated ticket found" });
      return;
    }

    const ticket = await dbService.getTicketById(ticketIds[0]);

    if (!ticket) {
      res.status(404).json({ error: "Ticket not found" });
      return;
    }

    res.json({
      request: {
        request_id: request.request_id,
        email: request.email,
        created_at: request.created_at,
        tracking_id: request.tracking_id,
      },
      ticket: {
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        status: ticket.status?.name || "Draft",
        summary: ticket.summary,
        suggested_solution: ticket.suggested_solution, // <--- ADDED THIS LINE
        updated_at: ticket.updated_at,
        deadline: ticket.deadline,
        comments: (ticket.comments || [])
          .filter((c: any) => !c.is_internal)
          .map((c: any) => ({
            comment_id: c.comment_id,
            content: c.content,
            created_at: c.created_at,
            user_name: c.user?.name || "Unknown",
          })),
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ... (Rest of the file remains unchanged)
export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
    // ... (Your existing code)
    try {
        if (!req.user || (req.user as UserProfile).role !== "ADMIN") {
          res.status(403).json({ error: "Forbidden - Admin access required" });
          return;
        }
    
        const { page = 1, limit = 20 } = req.query;
        // Note: Pagination would require additional implementation in the db service
        res.json({
          message: "Pagination implementation required",
          hint: "Use /api/requests/track/:tracking_id to get request details",
        });
      } catch (err) {
        const error = err as Error;
        console.error(err);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
};

export const verifyTrackingToken = async (req: Request, res: Response): Promise<void> => {
    // ... (Your existing code)
    try {
        const { token } = req.body;
    
        if (!token) {
          res.status(400).json({ error: "Token is required" });
          return;
        }
    
        // Import here to avoid circular dependency
        const { verifyTrackingToken } = await import("../services/auth.service");
        const decoded = verifyTrackingToken(token);
    
        if (!decoded) {
          res.status(401).json({ error: "Invalid or expired tracking token" });
          return;
        }
    
        res.json({
          valid: true,
          email: decoded.email,
          request_id: decoded.request_id,
        });
      } catch (err) {
        const error = err as Error;
        console.error(err);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
};