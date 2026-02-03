import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== USER SERVICE =====
export const getOrCreateUser = async (email: string, name?: string, googleId?: string) => {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        googleId,
        googleEmail: email
      }
    });
  }

  return user;
};

export const getUserById = async (userId: number) => {
  return await prisma.user.findUnique({ where: { userId } });
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const createUserWithPassword = async (email: string, hashedPassword: string, name: string) => {
  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  });
};

export const toggleAssigneeRole = async (userId: number, isAssignee: boolean) => {
  return await prisma.user.update({
    where: { userId },
    data: { isAssignee }
  });
};

export const getAllAssignees = async () => {
  return await prisma.user.findMany({
    where: { isAssignee: true },
    include: {
      scopes: true,
      ticketAssignments: {
        where: { isActive: true }
      }
    }
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
    where: { requestId },
    include: { ticketRequests: true }
  });
};

export const getRequestByTrackingId = async (trackingId: string) => {
  return await prisma.request.findUnique({
    where: { trackingId },
    include: { ticketRequests: { include: { ticket: true } } }
  });
};

// ===== TICKET SERVICE =====
export const createTicket = async (
  title: string,
  summary: string,
  categoryId: number,
  status: string = 'Draft'
) => {
  return await prisma.ticket.create({
    data: {
      title,
      summary,
      categoryId,
      status
    }
  });
};

export const getTicketById = async (ticketId: number) => {
  return await prisma.ticket.findUnique({
    where: { ticketId },
    include: {
      category: true,
      assignments: { include: { assignee: true } },
      comments: { include: { user: true } },
      statusHistory: { include: { user: true } },
      followers: { include: { user: true } },
      ticketRequests: { include: { request: true } }
    }
  });
};

export const updateTicket = async (ticketId: number, data: any) => {
  return await prisma.ticket.update({
    where: { ticketId },
    data
  });
};

export const getDraftTickets = async () => {
  return await prisma.ticket.findMany({
    where: { status: 'Draft' },
    include: {
      category: true,
      assignments: { include: { assignee: true } },
      ticketRequests: { include: { request: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTicketsByStatus = async (status: string) => {
  return await prisma.ticket.findMany({
    where: { status },
    include: {
      category: true,
      assignments: { include: { assignee: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTicketsByAssignee = async (assigneeId: number) => {
  return await prisma.ticket.findMany({
    where: {
      assignments: {
        some: {
          assigneeId,
          isActive: true
        }
      },
      status: { notIn: ['Solved', 'Failed'] }
    },
    include: {
      category: true,
      assignments: { include: { assignee: true } }
    },
    orderBy: { deadline: 'asc' }
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

// ===== ASSIGNMENT SERVICE =====
export const assignTicket = async (ticketId: number, assigneeId: number) => {
  // Check if already assigned
  const existing = await prisma.ticketAssignment.findUnique({
    where: {
      ticketId_assigneeId: { ticketId, assigneeId }
    }
  });

  if (existing) {
    return await prisma.ticketAssignment.update({
      where: { assignmentId: existing.assignmentId },
      data: { isActive: true }
    });
  }

  return await prisma.ticketAssignment.create({
    data: { ticketId, assigneeId }
  });
};

export const unassignTicket = async (ticketId: number, assigneeId: number) => {
  return await prisma.ticketAssignment.updateMany({
    where: { ticketId, assigneeId },
    data: { isActive: false }
  });
};

export const getTicketAssignees = async (ticketId: number) => {
  return await prisma.ticketAssignment.findMany({
    where: { ticketId, isActive: true },
    include: { assignee: true }
  });
};

// ===== COMMENT SERVICE =====
export const addComment = async (ticketId: number, userId: number, content: string, isInternal: boolean = false) => {
  return await prisma.comment.create({
    data: {
      ticketId,
      userId,
      content,
      isInternal
    }
  });
};

export const getTicketComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticketId },
    include: { user: true },
    orderBy: { createdAt: 'asc' }
  });
};

export const getPublicComments = async (ticketId: number) => {
  return await prisma.comment.findMany({
    where: { ticketId, isInternal: false },
    include: { user: true },
    orderBy: { createdAt: 'asc' }
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
      ticketId,
      oldStatus,
      newStatus,
      changedBy
    }
  });
};

export const getStatusHistory = async (ticketId: number) => {
  return await prisma.statusHistory.findMany({
    where: { ticketId },
    include: { user: true },
    orderBy: { changedAt: 'asc' }
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
      ticketId,
      oldAssigneeId,
      newAssigneeId
    }
  });
};

export const getAssignmentHistory = async (ticketId: number) => {
  return await prisma.assignmentHistory.findMany({
    where: { ticketId },
    include: { oldAssignee: true, newAssignee: true },
    orderBy: { changedAt: 'asc' }
  });
};

// ===== FOLLOWER SERVICE =====
export const addFollower = async (ticketId: number, userId: number) => {
  return await prisma.follower.upsert({
    where: {
      ticketId_userId: { ticketId, userId }
    },
    update: {},
    create: { ticketId, userId }
  });
};

export const getFollowers = async (ticketId: number) => {
  return await prisma.follower.findMany({
    where: { ticketId },
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
      ticketId,
      userId,
      type,
      message
    }
  });
};

export const getUserNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId },
    include: { ticket: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const markNotificationAsRead = async (notificationId: number) => {
  return await prisma.notification.update({
    where: { notificationId },
    data: { isRead: true }
  });
};

// ===== SCOPE SERVICE =====
export const assignScope = async (assigneeId: number, scopeName: string) => {
  return await prisma.assigneeScope.upsert({
    where: {
      assigneeId_scopeName: { assigneeId, scopeName }
    },
    update: {},
    create: { assigneeId, scopeName }
  });
};

export const getAssigneeScopes = async (assigneeId: number) => {
  return await prisma.assigneeScope.findMany({
    where: { assigneeId }
  });
};

export const removeScope = async (assigneeId: number, scopeName: string) => {
  return await prisma.assigneeScope.deleteMany({
    where: { assigneeId, scopeName }
  });
};

// ===== OAUTH SERVICE =====
export const saveOAuthToken = async (userId: number, googleToken: string, refreshToken?: string, expiresAt?: Date) => {
  return await prisma.oAuthToken.upsert({
    where: { userId },
    update: { googleToken, refreshToken, expiresAt },
    create: { userId, googleToken, refreshToken, expiresAt }
  });
};

export const getOAuthToken = async (userId: number) => {
  return await prisma.oAuthToken.findUnique({ where: { userId } });
};

// ===== REPORTING SERVICE =====
export const getTicketStats = async (startDate?: Date, endDate?: Date) => {
  const where = startDate && endDate ? {
    createdAt: { gte: startDate, lte: endDate }
  } : {};

  const totalTickets = await prisma.ticket.count({ where });
  const byStatus = await prisma.ticket.groupBy({
    by: ['status'],
    where,
    _count: true
  });
  const byCategory = await prisma.ticket.groupBy({
    by: ['categoryId'],
    where,
    _count: true
  });

  return { totalTickets, byStatus, byCategory };
};

export const getAssigneeMetrics = async (assigneeId: number, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const currentTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assigneeId, isActive: true }
      },
      status: { notIn: ['Solved', 'Failed'] }
    }
  });

  const solvedTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assigneeId }
      },
      status: 'Solved',
      updatedAt: { gte: startDate }
    }
  });

  const failedTickets = await prisma.ticket.count({
    where: {
      assignments: {
        some: { assigneeId }
      },
      status: 'Failed',
      updatedAt: { gte: startDate }
    }
  });

  return { currentTickets, solvedTickets, failedTickets };
};

// ===== TICKET REQUEST SERVICE =====
export const linkRequestToTicket = async (ticketId: number, requestId: number) => {
  return await prisma.ticketRequest.create({
    data: { ticketId, requestId }
  });
};

export const unlinkRequestFromTicket = async (ticketId: number, requestId: number) => {
  return await prisma.ticketRequest.delete({
    where: {
      ticketId_requestId: { ticketId, requestId }
    }
  });
};

export const getTicketRequests = async (ticketId: number) => {
  return await prisma.ticketRequest.findMany({
    where: { ticketId },
    include: { request: true }
  });
};
