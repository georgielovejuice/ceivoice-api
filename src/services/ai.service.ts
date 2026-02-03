export const generateDraft = (message: string) => {
  return {
    title: "User reported an issue",
    summary: message.substring(0, 500),
    suggested_solution: "Check system status and user permissions",
    category_id: 1
  };
};
