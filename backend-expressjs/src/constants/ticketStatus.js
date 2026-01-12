exports.TicketStatus = {
  DRAFT: "DRAFT",
  NEW: "NEW",
  SOLVING: "SOLVING",
  SOLVED: "SOLVED",
  FAILED: "FAILED"
};

exports.AllowedTransitions = {
  DRAFT: ["NEW"],
  NEW: ["SOLVING"],
  SOLVING: ["SOLVED", "FAILED"],
  SOLVED: [],
  FAILED: []
};
