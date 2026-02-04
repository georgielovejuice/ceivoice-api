export enum TicketStatus {
  DRAFT = "DRAFT",
  NEW = "NEW",
  SOLVING = "SOLVING",
  SOLVED = "SOLVED",
  FAILED = "FAILED"
}

export type UserRole = "USER" | "ADMIN";

export const RoleTransitions: Record<UserRole, Record<TicketStatus, TicketStatus[]>> = {
  USER: {
    [TicketStatus.DRAFT]: [TicketStatus.NEW],
    [TicketStatus.NEW]: [],
    [TicketStatus.SOLVING]: [],
    [TicketStatus.SOLVED]: [],
    [TicketStatus.FAILED]: []
  },
  ADMIN: {
    [TicketStatus.DRAFT]: [],
    [TicketStatus.NEW]: [TicketStatus.SOLVING],
    [TicketStatus.SOLVING]: [TicketStatus.SOLVED, TicketStatus.FAILED],
    [TicketStatus.SOLVED]: [],
    [TicketStatus.FAILED]: []
  }
};

export const AllowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.DRAFT]: [TicketStatus.NEW],
  [TicketStatus.NEW]: [TicketStatus.SOLVING],
  [TicketStatus.SOLVING]: [TicketStatus.SOLVED, TicketStatus.FAILED],
  [TicketStatus.SOLVED]: [],
  [TicketStatus.FAILED]: []
};
