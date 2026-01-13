const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const aiService = require("../services/ai.service");

exports.submitRequest = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body missing" });
    }
    
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required" });
    }

    // 1. Save raw request
    const request = await prisma.request.create({
      data: { email, message }
    });

    // 2. AI draft
    const ai = aiService.generateDraft(message);

    // 3. Create draft ticket
    const ticket = await prisma.ticket.create({
      data: {
        title: ai.title,
        summary: ai.summary,
        suggested_solution: ai.suggested_solution,
        status: "DRAFT",
        category_id: ai.category_id
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
    res.status(500).json({ error: "Internal server error : " + err.message });
  }
};
