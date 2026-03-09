// Numeric IDs that map to TicketStatus rows in the database.
// Use these instead of raw magic numbers (e.g. status_id === 1).
export const STATUS_ID = {
  DRAFT:    1,
  NEW:      2,
  ASSIGNED: 3,
  SOLVING:  4,
  SOLVED:   5,
  FAILED:   6,
  RENEW:    7,
} as const;

export type StatusId = (typeof STATUS_ID)[keyof typeof STATUS_ID];

export const RESOLVED_STATUS_IDS:     number[] = [STATUS_ID.SOLVED, STATUS_ID.FAILED];
export const ACTIVE_STATUS_IDS:       number[] = [STATUS_ID.NEW, STATUS_ID.ASSIGNED, STATUS_ID.SOLVING, STATUS_ID.RENEW];
export const REASSIGNABLE_STATUS_IDS: number[] = [STATUS_ID.DRAFT, STATUS_ID.NEW, STATUS_ID.ASSIGNED, STATUS_ID.FAILED];

export enum TicketStatus {
  Draft    = "Draft",
  New      = "New",
  Assigned = "Assigned",
  Solving  = "Solving",
  Solved   = "Solved",
  Failed   = "Failed",
  Renew    = "Renew"
}

export enum UserRole {
  USER     = "USER",
  ASSIGNEE = "ASSIGNEE",
  ADMIN    = "ADMIN"
}

export const TICKET_STATUS_VALUES = Object.values(TicketStatus);
export const USER_ROLE_VALUES     = Object.values(UserRole);
