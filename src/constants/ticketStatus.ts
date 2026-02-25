export enum TicketStatus {
  Draft = "Draft",
  New = "New",
  Assigned = "Assigned",
  Solving = "Solving",
  Solved = "Solved",
  Failed = "Failed",
  Renew = "Renew"
}

export enum UserRole {
  USER = "USER",
  ASSIGNEE = "ASSIGNEE",
  ADMIN = "ADMIN"
}

export const TICKET_STATUS_VALUES = Object.values(TicketStatus);
export const USER_ROLE_VALUES = Object.values(UserRole);
