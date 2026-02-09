export interface DraftTicketData {
  title: string;
  summary: string;
  suggested_solution: string;
  category_id: number;
}

/**
 * Generate draft ticket data from user message
 * This is a placeholder that can be enhanced with actual AI/ML models
 */
export const generateDraft = (message: string): DraftTicketData => {
  return {
    title: "User reported an issue",
    summary: message.substring(0, 500),
    suggested_solution: "Check system status and user permissions",
    category_id: 1
  };
};

/**
 * Analyze ticket for suggested category
 */
export const analyzeSuggestedCategory = (message: string): number => {
  // Simple keyword-based categorization
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("payment") || lowerMessage.includes("billing")) return 2;
  if (lowerMessage.includes("technical") || lowerMessage.includes("bug")) return 3;
  if (lowerMessage.includes("feature") || lowerMessage.includes("request")) return 4;
  
  return 1; // Default category
};

/**
 * Generate suggested solution based on ticket content
 */
export const generateSuggestedSolution = (title: string, summary: string): string => {
  const content = `${title} ${summary}`.toLowerCase();
  
  if (content.includes("password") || content.includes("login")) {
    return "Verify account credentials and reset password if needed";
  }
  if (content.includes("error") || content.includes("crash")) {
    return "Check error logs and restart the application";
  }
  if (content.includes("slow") || content.includes("performance")) {
    return "Analyze system resources and optimize queries";
  }
  
  return "Review ticket details and escalate if necessary";
};

/**
 * Estimate priority based on keywords
 */
export const estimatePriority = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("urgent") || lowerMessage.includes("critical") || lowerMessage.includes("critical")) {
    return "HIGH";
  }
  if (lowerMessage.includes("important")) {
    return "MEDIUM";
  }
  
  return "LOW";
};
