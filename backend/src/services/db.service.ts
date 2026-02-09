import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ===== TICKET SERVICE =====

export const createTicket = async (
  title: string,
  summary: string,
  categoryId: number,
  status: string = "Draft"
) => {
  return await prisma.ticket.create({
    data: {
      title,
      summary,
      category_id: categoryId,
      status
    }
  });
};

export const getTicketById = async (ticketId: number) => {
  return await prisma.ticket.findUnique({
    where: { ticket_id: ticketId },
    include: {
      category: true,
      assignments: { include: { assignee: true } },
      comments: { include: { user: true } },
      status_history: { include: { user: true } },
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
    where: { status: "Draft" },
    include: {
      category: true,
      assignments: { include: { assignee: true } },
      ticket_requests: { include: { request: true } }
    },
    orderBy: { created_at: "desc" }
  });
};

export const getTicketsByStatus = async (status: string) => {
  return await prisma.ticket.findMany({
    where: { status },
    include: {
      category: true,
      assignments: { include: { assignee: true } }
    },
    orderBy: { created_at: "desc" }
  });
};

export const getTicketsByAssignee = async (assigneeId: number) => {
  return await prisma.ticket.findMany({
    where: {
      assignments: {
        some: {
          assignee_id: assigneeId,
          is_active: true
        }
      },
      status: { notIn: ["Solved", "Failed"] }
    },
    include: {
      category: true,
      assignments: { include: { assignee: true } }
    },
    orderBy: { deadline: "asc" }
  });
};

// ===== CATEGORY SERVICE =====

export const getOrCreateCategory = async (categoryName: string) => {
  let category = await prisma.category.findUnique({
    where: { name: categoryName }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: categoryName }
    });
  }

  return category;
};

export const getAllCategories = async () => {
  return await prisma.category.findMany();
};

// ===== USER SERVICE =====

export const getAllAssignees = async () => {
  return await prisma.user.findMany({
    where: { is_assignee: true },
    include: {
      scopes: true,
      ticket_assignments: {
        where: { is_active: true }
      }
    }
  });
};

// ===== ASSIGNMENT SERVICE =====

export const assignTicket = async (
  ticketId: number,
  assigneeId: number
) => {
  // Check if already assigned
  const existing = await prisma.ticketAssignment.findUnique({
    where: {
      ticket_id_assignee_id: { ticket_id: ticketId, assignee_id: assigneeId }
    }
  });

  if (existing) {
    return await prisma.ticketAssignment.update({
      where: { assignment_id: existing.assignment_id },
      data: { is_active: true }
    });
  }

  return await prisma.ticketAssignment.create({
    data: { ticket_id: ticketId, assignee_id: assigneeId }
  });
};

export const unassignTicket = async (
  ticketId: number,
  assigneeId: number
) => {
  return await prisma.ticketAssignment.updateMany({
    where: { ticket_id: ticketId, assignee_id: assigneeId },
    data: { is_active: false }
  });
};

export const getTicketAssignees = async (ticketId: number) => {
  return await prisma.ticketAssignment.findMany({
    where: { ticket_id: ticketId, is_active: true },
    include: { assignee: true }
  });
};

// ===== COMMENT SERVICE =====

export const addComment = async (
  ticketId: number,
  userId: number,
  content: string,
  isInternal: boolean = false
) => {
  return await prisma.comment.create({
    data: {
      ticket_id: ticketId,
      user_id: userId,
      content,
      is_internal: isInternal
    }
  });
};

export const getTicketComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticket_id: ticketId },
    include: { user: true },
    orderBy: { created_at: "asc" }
  });
};

export const getPublicComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticket_id: ticketId, is_internal: false },
    include: { user: true },
    orderBy: { created_at: "asc" }
  });
};

// ===== STATUS HISTORY SERVICE =====

export const createStatusHistory = async (
  ticketId: number,
  oldStatus: string,
  newStatus: string,
  changedBy: number
) => {
  return await prisma.statusHistory.create({
    data: {
      ticket_id: ticketId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy
    }
  });
};

export const getStatusHistory = async (ticketId: number) => {
  return await prisma.statusHistory.findMany({
    where: { ticket_id: ticketId },
    include: { user: true },
    orderBy: { changed_at: "asc" }
  });
};

// ===== ASSIGNMENT HISTORY SERVICE =====

export const createAssignmentHistory = async (
  ticketId: number,
  oldAssigneeId: number | null,
  newAssigneeId: number | null
) => {
  return await prisma.assignmentHistory.create({
    data: {
      ticket_id: ticketId,
      old_assignee_id: oldAssigneeId,
      new_assignee_id: newAssigneeId
    }
  });
};

export const getAssignmentHistory = async (ticketId: number) => {
  return await prisma.assignmentHistory.findMany({
    where: { ticket_id: ticketId },
    include: { old_assignee: true, new_assignee: true },
    orderBy: { changed_at: "asc" }
  });
};

// ===== FOLLOWER SERVICE =====

export const addFollower = async (ticketId: number, userId: number) => {
  return await prisma.follower.upsert({
    where: {
      ticket_id_user_id: { ticket_id: ticketId, user_id: userId }
    },
    update: {},
    create: { ticket_id: ticketId, user_id: userId }
  });
};

export const getFollowers = async (ticketId: number) => {
  return await prisma.follower.findMany({
    where: { ticket_id: ticketId },
    include: { user: true }
  });
};

// ===== NOTIFICATION SERVICE =====

export const createNotification = async (
  ticketId: number,
  userId: number,
  type: string,
  message: string
) => {
  return await prisma.notification.create({
    data: {
      ticket_id: ticketId,
      user_id: userId,
      type,
      message
    }
  });
};

export const getUserNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    include: { ticket: true },
    orderBy: { created_at: "desc" }
  });
};

export const markNotificationAsRead = async (notificationId: number) => {
  return await prisma.notification.update({
    where: { notification_id: notificationId },
    data: { is_read: true }
  });
};

// ===== SCOPE SERVICE =====

export const assignScope = async (assigneeId: number, scopeName: string) => {
  return await prisma.assigneeScope.upsert({
    where: {
      assignee_id_scope_name: { assignee_id: assigneeId, scope_name: scopeName }
    },
    update: {},
    create: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

export const getAssigneeScopes = async (assigneeId: number) => {
  return await prisma.assigneeScope.findMany({
    where: { assignee_id: assigneeId }
  });
};

export const removeScope = async (assigneeId: number, scopeName: string) => {
  return await prisma.assigneeScope.deleteMany({
    where: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

// ===== OAUTH SERVICE =====

export const saveOAuthToken = async (
  userId: number,
  googleToken: string,
  refreshToken?: string,
  expiresAt?: Date
) => {
  return await prisma.oAuthToken.upsert({
    where: { user_id: userId },
    update: { google_token: googleToken, refresh_token: refreshToken, expires_at: expiresAt },
    create: { user_id: userId, google_token: googleToken, refresh_token: refreshToken, expires_at: expiresAt }
  });
};

export const getOAuthToken = async (userId: number) => {
  return await prisma.oAuthToken.findUnique({
    where: { user_id: userId }
  });
};

// ===== TICKET REQUEST SERVICE =====

export const linkRequestToTicket = async (
  ticketId: number,
  requestId: number
) => {
  return await prisma.ticketRequest.create({
    data: { ticket_id: ticketId, request_id: requestId }
  });
};

export const unlinkRequestFromTicket = async (
  ticketId: number,
  requestId: number
) => {
  return await prisma.ticketRequest.delete({
    where: {
      ticket_id_request_id: { ticket_id: ticketId, request_id: requestId }
    }
  });
};

export const getTicketRequests = async (ticketId: number) => {
  return await prisma.ticketRequest.findMany({
    where: { ticket_id: ticketId },
    include: { request: true }
  });
};

// ===== REQUEST SERVICE =====

export const createRequest = async (email: string, message: string) => {
  return await prisma.request.create({
    data: { email, message }
  });
};

export const getRequestById = async (requestId: number) => {
  return await prisma.request.findUnique({
    where: { request_id: requestId },
    include: { ticket_requests: true }
  });
};

export const getRequestByTrackingId = async (trackingId: string) => {
  return await prisma.request.findUnique({
    where: { tracking_id: trackingId },
    include: { ticket_requests: { include: { ticket: true } } }
  });
};

// ===== REPORTING SERVICE =====

export const getTicketStats = async (
  startDate?: Date,
  endDate?: Date
) => {
  const where =
    startDate && endDate
      ? {
          created_at: { gte: startDate, lte: endDate }
        }
      : {};

  const totalTickets = await prisma.ticket.count({ where });
  const byStatus = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: true
  });
  const byCategory = await prisma.ticket.groupBy({
    by: ["category_id"],
    where,
    _count: true
  });

  return { totalTickets, byStatus, byCategory };
};

export const getAssigneeMetrics = async (
  assigneeId: number,
  days: number = 30
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const currentTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assignee_id: assigneeId, is_active: true }
      },
      status: { notIn: ["Solved", "Failed"] }
    }
  });

  const solvedTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assignee_id: assigneeId }
      },
      status: "Solved",
      updated_at: { gte: startDate }
    }
  });

  const failedTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assignee_id: assigneeId }
      },
      status: "Failed",
      updated_at: { gte: startDate }
    }
  });

  return { currentTickets, solvedTickets, failedTickets };
};
