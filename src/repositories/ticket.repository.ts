import prisma from "../lib/prisma";

export const createTicket = async (
  title: string,
  summary: string,
  categoryId: number,
  creatorUserId: string | null,
  statusId: number = 1 // 1 = Draft
) => {
  return await prisma.ticket.create({
    data: {
      title,
      summary,
      category_id: categoryId,
      creator_user_id: creatorUserId,
      status_id: statusId
    },
    include: {
      status: true,
      category: true,
      creator: true
    }
  });
};

export const getTicketById = async (ticketId: number) => {
  return await prisma.ticket.findUnique({
    where: { ticket_id: ticketId },
    include: {
      status: true,
      category: true,
      creator: true,
      assignee: true,
      comments: { include: { user: true }, orderBy: { created_at: "asc" as const } },
      status_history: { include: { old_status: true, new_status: true, changed_by: true }, orderBy: { changed_at: "asc" as const } },
      assignment_history: { include: { old_assignee: true, new_assignee: true, changed_by: true }, orderBy: { changed_at: "asc" as const } },
      followers: { include: { user: true } },
      ticket_requests: { include: { request: true } }
    }
  });
};

export const updateTicket = async (ticketId: number, data: any) => {
  return await prisma.ticket.update({
    where: { ticket_id: ticketId },
    data
  });
};

export const getDraftTickets = async () => {
  return await prisma.ticket.findMany({
    where: { status_id: 1, parent_ticket_id: null }, // 1 = Draft, exclude merged children
    include: {
      status: true,
      category: true,
      creator: true,
      ticket_requests: { include: { request: true } }
    },
    orderBy: { created_at: "desc" }
  });
};

export const getAllTickets = async () => {
  return await prisma.ticket.findMany({
    include: {
      status: true,
      category: true,
      assignee: true,
      creator: true
    },
    orderBy: { created_at: "desc" }
  });
};

export const getTicketsByStatus = async (statusId: number) => {
  return await prisma.ticket.findMany({
    where: { status_id: statusId },
    include: {
      status: true,
      category: true,
      assignee: true
    },
    orderBy: { created_at: "desc" }
  });
};

/**
 * Get all tickets created by a specific user.
 * Includes the original request message via ticket_requests relation.
 */
export const getTicketsByCreator = async (userId: string) => {
  return await prisma.ticket.findMany({
    where: { creator_user_id: userId },
    include: {
      status: true,
      category: true,
      assignee: true,
      ticket_requests: { include: { request: true } }
    },
    orderBy: { created_at: "desc" }
  });
};

export const getTicketsByAssignee = async (assigneeId: string) => {
  return await prisma.ticket.findMany({
    where: {
      assignee_user_id: assigneeId,
      parent_ticket_id: null, // Exclude merged children
      status_id: { notIn: [5, 6] } // Exclude Solved (5) and Failed (6)
    },
    include: {
      status: true,
      category: true,
      assignee: true,
      creator: true
    },
    orderBy: { deadline: "asc" }
  });
};

export const getResolvedTicketsByAssignee = async (assigneeId: string) => {
  return await prisma.ticket.findMany({
    where: {
      assignee_user_id: assigneeId,
      status_id: { in: [5, 6] } // Only Solved (5) and Failed (6)
    },
    include: {
      status: true,
      category: true,
      assignee: true,
      creator: true
    },
    orderBy: { updated_at: "desc" }
  });
};

export const getChildTickets = async (parentTicketId: number, statusId: number) => {
  return await prisma.ticket.findMany({
    where: { parent_ticket_id: parentTicketId, status_id: statusId }
  });
};

export const getTicketsByAssigneeAndStatuses = async (
  assigneeId: string,
  statusIds: number[],
  sortBy: string = "deadline"
) => {
  const orderBy: any = {};
  if (sortBy === "deadline") orderBy.deadline = "asc";
  else if (sortBy === "priority") orderBy.priority = "desc";
  else orderBy.created_at = "desc";

  return await prisma.ticket.findMany({
    where: { assignee_user_id: assigneeId, status_id: { in: statusIds } },
    include: {
      category: true,
      status: true,
      status_history: {
        orderBy: { changed_at: "desc" },
        take: 1,
        include: { new_status: true }
      }
    },
    orderBy
  });
};
