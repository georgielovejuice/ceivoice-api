import { Ollama } from "ollama";
import { PrismaClient } from "@prisma/client";
import config from "../config/environment";

const prisma = new PrismaClient();
const ollama = new Ollama({ host: config.ai.ollamaHost });

export class AiService {
  private readonly modelName = config.ai.modelName;

  /**
   * ALL-IN-ONE BACKGROUND WORKER
   * Processes Category, Priority, Assignee, Summary, and Solution in one pass.
   */
  async processTicketFull(
    ticketId: number,
    userMessage: string,
    availableCategoryNames: string[],
    availableAgents: any[],
  ) {
    try {
      // 1. The Index Trick: Map simple numbers to complicated UUIDs
      const agentMap: Record<number, string> = {};

      const agentList = availableAgents.map((a, index) => {
        agentMap[index] = a.user_id;
        return {
          id: index, // Give the AI a simple number
          name: a.full_name || 'Agent',
          skills: a.scopes ? a.scopes.map((s: any) => s.scope_name).join(", ") : "General"
        };
      });

      // 👇 THE HACK: Add a fake agent to the end of the list for the AI to pick
      const UNASSIGNED_ID = -1;
      agentList.push({
        id: UNASSIGNED_ID,
        name: "Unassigned Queue",
        skills: "Use this agent if the request does not perfectly match the skills of the other agents. Do not guess."
      });

      // 2. The Master Prompt
      const prompt = `
        You are an expert Corporate Helpdesk Dispatcher. Analyze the user's request: "${userMessage}"
        Valid Categories: ${JSON.stringify(availableCategoryNames)}
        Available Agents: ${JSON.stringify(agentList)}

        Output strictly JSON with these exact keys:
        {
          "title": "Short, concise title",
          "category": "Must match one of the Valid Categories exactly",
          "assignee_id": "Look at your chosen 'category'. Find an agent whose 'skills' explicitly cover this category. If there is no explicit match, you MUST output -1. Do not guess.",
          "priority": "Low", "Medium", "High", or "Critical",
          "summary": "Write a formal 2-sentence dispatcher summary. Sentence 1: State the core problem. Sentence 2: State the business impact. Do NOT use first-person pronouns.",
          "suggested_solution": "A step-by-step guide to fix it. Return a single string, NOT an array. Format as a numbered list: 1. Step one. 2. Step two."
        }
      `;


      // 3. Call the local AI Model
      const response = await ollama.chat({
        model: this.modelName,
        format: "json",
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.2 },
      });

      const data = JSON.parse(response.message.content);


      // 4. Data Formatting & Fallbacks
      // 👇 Update this logic so if the AI picks -1, it translates to a real database 'null'
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

      // Lookup the actual category ID from the database based on the AI's string choice
      const categoryRecord = await prisma.category.findUnique({
        where: { name: finalCategoryName },
      });

      // 5. Update the placeholder ticket in the database with the real data!
      await prisma.ticket.update({
        where: { ticket_id: ticketId },
        data: {
          title: data.title || "New Support Request",
          summary: data.summary || "Summary generation failed.",
          suggested_solution: solutionText,
          priority: data.priority || "Medium",
          assignee_user_id: finalAssigneeId,
          category_id: categoryRecord?.category_id,
          status: {
            connect: { name: "Draft" }
          }
        },
      });

      console.log(
        `✅ Background AI Processing Complete for Ticket #${ticketId}`,
      );
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
