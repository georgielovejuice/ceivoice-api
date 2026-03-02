import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import * as emailService from "../services/email.service";
import { aiService } from "../services/ai.service";

import * as validator from "email-validator";
import jwt from "jsonwebtoken";
import config from "../config/environment";

interface AiTicketDraft {
  title: string;
  category: string;
  summary: string;
  suggested_solution: string | string[];
  priority: string;
  assignee_id: string | null;
}

// ---------------------------------------------------------------------------
// Stub draft — used until the AI service is enabled.
// Replace this call with `aiService.generateDraft(message, categoryNames, allAgents)`
// once the AI model is running.
// ---------------------------------------------------------------------------
function buildBasicDraft(message: string, categoryNames: string[]): AiTicketDraft {
  // Strip leading markdown bold (e.g. "**Subject**\n\nBody") to get a clean title
  const firstLine = message.split('\n')[0].replace(/^\*\*(.+)\*\*$/, '$1').trim();
  const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine || 'New Support Request';

  return {
    title,
    category: categoryNames[0] ?? 'General',
    summary: message.slice(0, 300),
    suggested_solution: 'Under review by the support team.',
    priority: 'Medium',
    assignee_id: null,
  };
}

// ===== SUBMIT REQUEST (PUBLIC — no auth required) =====
export const submitRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, message, user_id = null } = req.body;

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

    // 1. Persist the raw user request
    const newRequest = await dbService.createRequest(email, message);

    // 2. Fetch lookup data for ticket creation
    const allCategories = await dbService.getAllActiveCategories();
    const allAgents     = await dbService.getAllAssignees();

    // 3. Resolve default category (fallback to "General")
    let defaultCategoryId = allCategories.find((c) => c.name === "General")?.category_id;
    if (!defaultCategoryId) {
      const created = await dbService.getOrCreateCategory("General");
      defaultCategoryId = created.category_id;
    }

    // 4. Generate a quick synchronous draft (AI will overwrite this asynchronously)
    const aiDraft = buildBasicDraft(message, allCategories.map((c) => c.name));

    // 5. Create the placeholder Draft ticket immediately
    const ticket = await dbService.createTicket(
      aiDraft.title,
      aiDraft.summary,
      defaultCategoryId,
      user_id,
    );

    const solutionText = Array.isArray(aiDraft.suggested_solution)
      ? "- " + aiDraft.suggested_solution.join("\n- ")
      : aiDraft.suggested_solution;

    await dbService.updateTicket(ticket.ticket_id, {
      suggested_solution: solutionText,
      assignee_user_id: aiDraft.assignee_id,
    });

    // 6. Link request → ticket
    await dbService.linkRequestToTicket(ticket.ticket_id, newRequest.request_id);

    // 7. Fire-and-forget full AI enrichment (slow path — moves ticket to Draft with AI content)
    aiService.processTicketFull(
      ticket.ticket_id,
      message,
      allCategories.map((c) => c.name),
      allAgents,
    ).catch((err: unknown) => console.error("❌ Background AI Worker failed:", err));

    // 8. Fire-and-forget confirmation email
    emailService
      .sendConfirmationEmail(email, newRequest.tracking_id, ticket.ticket_id)
      .catch((err) => console.error("Failed to send confirmation email:", err));

    // 9. Return instantly to the user
    res.status(201).json({
      message: "Request submitted successfully. AI is currently classifying and assigning your ticket.",
      ticket_id: ticket.ticket_id,
      tracking_id: newRequest.tracking_id,
      status: "Draft",
    });
  } catch (err) {
    const error = err as Error;
    console.error("submitRequest error:", err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ===== TRACK REQUEST (PUBLIC — anyone with tracking_id can check status) =====
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
        suggested_solution: ticket.suggested_solution,
        updated_at: ticket.updated_at,
        deadline: ticket.deadline,
        comments: (ticket.comments || [])
          .filter((c: any) => c.visibility === "PUBLIC")
          .map((c: any) => ({
            comment_id: c.comment_id,
            content: c.content,
            created_at: c.created_at,
            user_name: c.user?.user_name ?? c.user?.full_name ?? "Support Team",
          })),
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error("trackRequest error:", err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ===== GET ALL REQUESTS (admin only — enforced via middleware in route file) =====
// ✅ Role check removed from here — use authorize(["admin"]) in request.route.ts instead
export const getAllRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    res.json({
      message: "Pagination implementation required",
      hint: "Use /api/requests/track/:tracking_id to get request details",
    });
  } catch (err) {
    const error = err as Error;
    console.error("getAllRequests error:", err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ===== VERIFY TRACKING TOKEN =====
// ✅ Fixed: uses SUPABASE_JWT_SECRET instead of removed custom verifyTrackingToken
// Note: if tracking tokens need to outlive user sessions, consider a DB-based
// approach (store token hash + expiry in the requests table) instead of JWT
export const verifyTrackingToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.supabase.jwtSecret, {
        algorithms: ["HS256"],
      }) as { email?: string; request_id?: number };

      res.json({
        valid: true,
        email: decoded.email,
        request_id: decoded.request_id,
      });
    } catch {
      res.status(401).json({ error: "Invalid or expired tracking token" });
    }
  } catch (err) {
    const error = err as Error;
    console.error("verifyTrackingToken error:", err);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};