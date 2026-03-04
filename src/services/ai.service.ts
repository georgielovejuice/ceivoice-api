import { Ollama } from "ollama";
import { PrismaClient } from "@prisma/client";
import config from "../config/environment";

const prisma = new PrismaClient();
const ollama = new Ollama({ host: config.ai.ollamaHost });

export class AiService {
  private readonly modelName = config.ai.modelName;

  async processTicketFull(
    ticketId: number,
    userMessage: string,
    availableCategoryNames: string[],
    availableAgents: any[],
  ) {
    try {
      const agentMap: Record<number, string> = {};

      const agentList = availableAgents
      .filter(a => a.scopes && a.scopes.length > 0)  // only agents with skills
      .map((a, index) => {
        agentMap[index] = a.user_id;
        return {
          id: index,
          name: a.full_name || 'Agent',
          skills: a.scopes.map((s: any) => s.scope_name).join(", ")
        };
      });

      const UNASSIGNED_ID = -1;
      const CONFIDENCE_THRESHOLD = 75;

      // Build agent list for call 2 WITH unassigned option as escape hatch
      const agentListWithUnassigned = [
        ...agentList,
        {
          id: UNASSIGNED_ID,
          name: "Unassigned Queue",
          skills: "Use this if the request topic does not clearly match any other agent's skills."
        }
      ];


      // === CALL 1: Understand the ticket ===
      const call1Prompt = `
        You are a helpdesk ticket classifier. Analyze this support request: "${userMessage}"
        Valid Categories: ${JSON.stringify(availableCategoryNames)}

        Output strict JSON:
        {
          "title": "Short concise title under 100 characters",
          "category": "Exact match from Categories list",
          "priority": "Low" or "Medium" or "High" or "Critical",
          "summary": "2 sentences. First: core problem. Second: business impact. No first-person.",
          "suggested_solution": "1. Step one. 2. Step two. (single string)",
          "topic_keywords": "2-3 words describing the technical domain e.g. network connectivity, payroll salary, software access",
          "category_confidence": <0-100, how confident you are in the category choice>,
          "category_reason": "one sentence why this category fits"
        }
      `;

      const t0 = Date.now();
      const response1 = await ollama.chat({
        model: this.modelName,
        format: "json",
        messages: [{ role: "user", content: call1Prompt }],
        options: { temperature: 0.2 },
      });
      const data1 = JSON.parse(response1.message.content);

      // === CALL 2: Match to agent based on topic only ===
      const call2Prompt = `
        You are a helpdesk dispatcher. Your job is to find the best agent for this support request.

        Support topic: "${data1.topic_keywords}"
        Original message: "${userMessage}"

        Agents:
        ${JSON.stringify(agentListWithUnassigned)}

        Rules:
        - Think about what broad technical domain the message belongs to (e.g. "wifi and ethernet" belongs to "Network")
        - Match that domain to the closest agent skill, even if the wording is not identical
        - Only pick Unassigned Queue if there is truly no related domain among the agents
        - confidence is how sure you are about your pick (0-100)

        Output strict JSON:
        {
          "assignee_id": <number from Agents list>,
          "confidence": <0-100>,
          "reason": "one sentence why"
        }
      `;

      const response2 = await ollama.chat({
        model: this.modelName,
        format: "json",
        messages: [{ role: "user", content: call2Prompt }],
        options: { temperature: 0.1 },
      });
      const processingMs = Date.now() - t0;
      const data2 = JSON.parse(response2.message.content);

      const assigneeId = (data2.confidence >= CONFIDENCE_THRESHOLD) ? data2.assignee_id : UNASSIGNED_ID;
      const data = { ...data1, assignee_id: assigneeId };


      let finalAssigneeId = null;
      if (data.assignee_id !== null && data.assignee_id !== UNASSIGNED_ID && agentMap[data.assignee_id]) {
        finalAssigneeId = agentMap[data.assignee_id];
      }

      const finalCategoryName = availableCategoryNames.includes(data.category)
        ? data.category
        : availableCategoryNames[0] || "General";

      const solutionText = Array.isArray(data.suggested_solution)
        ? "- " + data.suggested_solution.join("\n- ")
        : data.suggested_solution;

      const categoryRecord = await prisma.category.findUnique({
        where: { name: finalCategoryName },
      });

      await prisma.ticket.update({
        where: { ticket_id: ticketId },
        data: {
          title: data.title || "New Support Request",
          summary: data.summary || "Summary generation failed.",
          suggested_solution: solutionText,
          priority: data.priority || "Medium",
          assignee_user_id: finalAssigneeId,
          category_id: categoryRecord?.category_id,
        },
      });

      await prisma.aiTicketMetric.upsert({
        where: { ticket_id: ticketId },
        update: {
          processing_ms:         processingMs,
          suggested_category_id: categoryRecord?.category_id ?? null,
          suggested_assignee_id: finalAssigneeId,
        },
        create: {
          ticket_id:             ticketId,
          processing_ms:         processingMs,
          suggested_category_id: categoryRecord?.category_id ?? null,
          suggested_assignee_id: finalAssigneeId,
        },
      });

      // === SAVE CONFIDENCE SCORES ===
      await prisma.aiTicketConfidence.upsert({
        where: { ticket_id: ticketId },
        update: {
          assignment_confidence: data2.confidence ?? null,
          assignment_reason:     data2.reason ?? null,
          category_confidence:   data1.category_confidence ?? null,
          category_reason:       data1.category_reason ?? null,
        },
        create: {
          ticket_id:             ticketId,
          assignment_confidence: data2.confidence ?? null,
          assignment_reason:     data2.reason ?? null,
          category_confidence:   data1.category_confidence ?? null,
          category_reason:       data1.category_reason ?? null,
        },
      });

      // === CALL 3: Suggest merge with existing drafts ===
      const recentDrafts = await prisma.ticket.findMany({
        where: {
          status: { name: 'Draft' },
          ticket_id: { not: ticketId },
          parent_ticket_id: null,
        },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { ticket_id: true, title: true, summary: true }
      });

      if (recentDrafts.length > 0) {
        const call3Prompt = `
          You are a helpdesk deduplication assistant.

          New ticket topic: "${data1.topic_keywords}"
          New ticket summary: "${data1.summary}"

          Existing draft tickets:
          ${JSON.stringify(recentDrafts)}

          Task: Find any existing draft whose topic is essentially the same issue as the new ticket.
          Only suggest a merge if the core problem is clearly the same — not just the same category.

          Output strict JSON:
          {
            "should_merge": true or false,
            "parent_ticket_id": <ticket_id of the best match, or null>,
            "reason": "one sentence why they are the same issue"
          }
        `;

        const response3 = await ollama.chat({
          model: this.modelName,
          format: "json",
          messages: [{ role: "user", content: call3Prompt }],
          options: { temperature: 0.1 },
        });
        const data3 = JSON.parse(response3.message.content);

        if (data3.should_merge && data3.parent_ticket_id) {
          await prisma.suggestedMerge.upsert({
            where: {
              suggested_parent_id_suggested_child_id: {
                suggested_parent_id: data3.parent_ticket_id,
                suggested_child_id:  ticketId,
              }
            },
            update: { similarity_reason: data3.reason },
            create: {
              suggested_parent_id: data3.parent_ticket_id,
              suggested_child_id:  ticketId,
              similarity_reason:   data3.reason,
            },
          });
        }
      }

    } catch (error) {
      console.error(`❌ Background AI failed for Ticket #${ticketId}:`, error);

      // If the AI crashes, update the ticket so the Admin knows it failed
      await prisma.ticket.update({
        where: { ticket_id: ticketId },
        data: { summary: "AI processing failed. Please review manually." },
      });
    }
  }
}

export const aiService = new AiService();