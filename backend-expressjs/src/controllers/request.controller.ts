import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as aiService from "../services/ai.service";

const prisma = new PrismaClient();

export const submitRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body) {
      res.status(400).json({ error: "Request body missing" });
      return;
    }

    const { email, message } = req.body;

    if (!email || !message) {
      res.status(400).json({ error: "Email and message are required" });
      return;
    }

    // 1. Save raw request
    const request = await prisma.request.create({
      data: { email, message }
    });

    // 2. AI draft
    const aiDraft = aiService.generateDraft(message);

    // 3. Create draft ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: aiDraft.title,
        summary: aiDraft.summary,
        suggested_solution: aiDraft.suggested_solution,
        status: "DRAFT",
        category_id: aiDraft.category_id
      }
    });

    // 4. Link request → ticket
    await prisma.ticketRequest.create({
      data: {
        ticket_id: ticket.ticket_id,
        request_id: request.request_id
      }
    });

    res.status(201).json({
      message: "Request submitted successfully",
      ticket_id: ticket.ticket_id
    });
  } catch (err) {
    console.error(err);
    const error = err as Error;
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};
