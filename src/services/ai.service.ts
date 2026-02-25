import ollama from 'ollama';

// 1. Update Interface to include assignee_id
export interface AiTicketDraft {
  title: string;
  category: string;
  summary: string;
  suggested_solution: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee_id: number | null; // <--- NEW FIELD
}

export class AiService {
  private modelName = 'ceivoice-ai'; 

  /**
   * Analyzes a raw user message and converts it into a structured Ticket Draft.
   * @param userMessage - The text from the Request
   * @param availableCategories - Array of category names
   * @param availableAgents - Array of agents with their skills (scopes)
   */
  async generateDraft(
    userMessage: string, 
    availableCategories: string[],
    availableAgents: any[] = [] // <--- NEW PARAMETER
  ): Promise<AiTicketDraft> {
    
    // Format agents for the AI prompt
    const agentList = availableAgents.map(a => ({
      id: a.user_id,
      name: a.name,
      // Assuming 'scopes' is an array of objects like { scope_name: 'Hardware' }
      skills: a.scopes ? a.scopes.map((s: any) => s.scope_name).join(", ") : ""
    }));

    // 2. Construct the prompt
    const prompt = `
      You are an expert IT Support Dispatcher. Analyze the user's request and output a JSON object.

      CONTEXT:
      - Valid Categories: ${JSON.stringify(availableCategories)}
      - Valid Priorities: ["Low", "Medium", "High", "Critical"]
      - Available Agents: ${JSON.stringify(agentList)}

      USER REQUEST:
      "${userMessage}"

      INSTRUCTIONS:
      1. title: Create a concise, professional title (max 80 chars).
      2. category: MUST be one of the Valid Categories provided above.
      3. assignee_id: Select the 'id' of the agent whose skills best match the request. If no strong match, return null.
      4. summary: Summarize the issue in 2-3 sentences.
      5. suggested_solution: specific, actionable steps to resolve this technical issue.
      6. priority: Assess urgency based on business impact.

      OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
      {
        "title": "...",
        "category": "...",
        "assignee_id": 123, 
        "summary": "...",
        "suggested_solution": "...",
        "priority": "..."
      }
    `;

    try {
      const response = await ollama.chat({
        model: this.modelName,
        format: 'json',
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.1 }
      });

      const data = JSON.parse(response.message.content);

      // Fallback logic
      const finalCategory = availableCategories.includes(data.category) 
        ? data.category 
        : availableCategories[0] || 'General';

      return {
        title: data.title || "New Support Request",
        category: finalCategory,
        summary: data.summary,
        suggested_solution: data.suggested_solution,
        priority: data.priority,
        assignee_id: data.assignee_id || null // <--- RETURN ID
      };

    } catch (error) {
      console.error("❌ AI Service Error:", error);
      return {
        title: "New Support Request",
        category: availableCategories[0] || "Uncategorized",
        summary: userMessage.substring(0, 200),
        suggested_solution: "AI processing failed. Please review manually.",
        priority: "Medium",
        assignee_id: null
      };
    }
  }
}

export const aiService = new AiService();