import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const db = prisma;
// This allows other files to access db.category, db.user, etc. directly.


// ===== TICKET SERVICE =====

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
      comments: { include: { user: true } },
      status_history: { include: { new_status: true, changed_by: true } },
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
    where: { status_id: 1 }, // 1 = Draft
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
      creator: true,
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

export const getTicketsByCreator = async (userId: string) => {
  return await prisma.ticket.findMany({
    where: { creator_user_id: userId },
    include: {
      status: true,
      category: true,
      assignee: true
    },
    orderBy: { created_at: "desc" }
  });
};

export const getTicketsByAssignee = async (assigneeId: string) => {
  return await prisma.ticket.findMany({
    where: {
      assignee_user_id: assigneeId,
      status_id: {
        notIn: [5, 6] // Exclude Solved (5) and Failed (6)
      }
    },
    include: {
      status: true,
      category: true,
      assignee: true
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
    where: { role: { in: ["ASSIGNEE", "ADMIN"] } },
    include: {
      scopes: true,
      assigned_tickets: {
        where: { status_id: { notIn: [5, 6] } } // Exclude Solved and Failed
      }
    }
  });
};

// ===== ASSIGNMENT SERVICE =====

export const assignTicket = async (
  ticketId: number,
  assigneeId: string
) => {
  return await prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: { assignee_user_id: assigneeId },
    include: { assignee: true, status: true }
  });
};

export const unassignTicket = async (
  ticketId: number
) => {
  return await prisma.ticket.update({
    where: { ticket_id: ticketId },
    data: { assignee_user_id: null },
    include: { status: true }
  });
};

export const getTicketAssignees = async (ticketId: number) => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticket_id: ticketId },
    include: { assignee: true }
  });

  return ticket?.assignee ? [ticket.assignee] : [];
};

// ===== COMMENT SERVICE =====

export const addComment = async (
  ticketId: number,
  userId: string,
  content: string,
  isInternal: boolean = false
) => {
  return await prisma.comment.create({
    data: {
      ticket_id: ticketId,
      user_id: userId,
      content,
      visibility: isInternal ? "PRIVATE" : "PUBLIC"
    },
    include: { user: true }
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
    where: { ticket_id: ticketId, visibility: "PUBLIC" },
    include: { user: true },
    orderBy: { created_at: "asc" }
  });
};

// ===== STATUS HISTORY SERVICE =====

export const createStatusHistory = async (
  ticketId: number,
  oldStatusId: number,
  newStatusId: number,
  changedById: string,
  changeReason?: string
) => {
  return await prisma.statusHistory.create({
    data: {
      ticket_id: ticketId,
      old_status_id: oldStatusId,
      new_status_id: newStatusId,
      changed_by_id: changedById,
      change_reason: changeReason
    },
    include: {
      old_status: true,
      new_status: true,
      changed_by: true
    }
  });
};

export const getStatusHistory = async (ticketId: number) => {
  return await prisma.statusHistory.findMany({
    where: { ticket_id: ticketId },
    include: { new_status: true, changed_by: true },
    orderBy: { changed_at: "asc" }
  });
};

// ===== ASSIGNMENT HISTORY SERVICE =====

export const createAssignmentHistory = async (
  ticketId: number,
  oldAssigneeId: string | null,
  newAssigneeId: string | null,
  changedById: string,
  changeReason?: string
) => {
  return await prisma.assignmentHistory.create({
    data: {
      ticket_id: ticketId,
      old_assignee_id: oldAssigneeId,
      new_assignee_id: newAssigneeId,
      changed_by_id: changedById,
      change_reason: changeReason
    },
    include: {
      old_assignee: true,
      new_assignee: true,
      changed_by: true
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

export const addFollower = async (ticketId: number, userId: string) => {
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

// Get user by email (for following request creators)
export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

// Get user by ID (for reassignment notifications)
export const getUserById = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { user_id: userId }
  });
};

// Update user role (for admin role management)
export const updateUserRole = async (userId: string, role: string) => {
  return await prisma.user.update({
    where: { user_id: userId },
    data: { role }
  });
};

// ===== NOTIFICATION SERVICE =====

export const createNotification = async (
  ticketId: number,
  userId: string,
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

export const getUserNotifications = async (userId: string) => {
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

export const assignScope = async (assigneeId: string, scopeName: string) => {
  return await prisma.assigneeScope.upsert({
    where: {
      assignee_id_scope_name: { assignee_id: assigneeId, scope_name: scopeName }
    },
    update: {},
    create: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

export const getAssigneeScopes = async (assigneeId: string) => {
  return await prisma.assigneeScope.findMany({
    where: { assignee_id: assigneeId }
  });
};

export const removeScope = async (assigneeId: string, scopeName: string) => {
  return await prisma.assigneeScope.deleteMany({
    where: { assignee_id: assigneeId, scope_name: scopeName }
  });
};

export const removeScopeById = async (scopeId: number) => {
  return await prisma.assigneeScope.delete({
    where: { scope_id: scopeId }
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
    by: ["status_id"],
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
  assigneeId: string,
  days: number = 30
) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const currentTickets = await prisma.ticket.count({
    where: {
      assignee_user_id: assigneeId,
      status_id: { notIn: [5, 6] } // Exclude Solved (5) and Failed (6)
    }
  });

  const solvedTickets = await prisma.ticket.count({
    where: {
      assignee_user_id: assigneeId,
      status_id: 5, // Solved
      updated_at: { gte: startDate }
    }
  });

  const failedTickets = await prisma.ticket.count({
    where: {
      assignee_user_id: assigneeId,
      status_id: 6, // Failed
      updated_at: { gte: startDate }
    }
  });

  return { currentTickets, solvedTickets, failedTickets };
};

// ===== REPORTING & ANALYTICS SERVICES =====

// Admin Metrics Functions

export const getTicketCount = async (dateFilter: Date | null) => {
  const where = dateFilter ? { created_at: { gte: dateFilter } } : {};
  return await prisma.ticket.count({ where });
};

export const getTicketCountByStatus = async (dateFilter: Date | null) => {
  const where = dateFilter ? { created_at: { gte: dateFilter } } : {};
  const result = await prisma.ticket.groupBy({
    by: ["status_id"],
    where,
    _count: { status_id: true }
  });
  return result.map(r => ({ status_id: r.status_id, count: r._count.status_id }));
};

export const getTicketCountByStatuses = async (statusIds: number[]) => {
  return await prisma.ticket.count({
    where: { status_id: { in: statusIds } }
  });
};

export const getAverageResolutionTime = async (dateFilter: Date | null) => {
  const where: any = {
    status_id: { in: [5, 6] }, // Solved (5) or Failed (6)
    resolved_at: { not: null },
    activated_at: { not: null }
  };

  if (dateFilter) {
    where.resolved_at = { ...where.resolved_at, gte: dateFilter };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      activated_at: true,
      resolved_at: true
    }
  });

  if (tickets.length === 0) return 0;

  const totalHours = tickets.reduce((sum, ticket) => {
    if (!ticket.activated_at || !ticket.resolved_at) return sum;
    const hours = (ticket.resolved_at.getTime() - ticket.activated_at.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return parseFloat((totalHours / tickets.length).toFixed(2));
};

export const getTopCategories = async (dateFilter: Date | null, limit: number = 5) => {
  const where = dateFilter ? { created_at: { gte: dateFilter } } : {};

  const result = await prisma.ticket.groupBy({
    by: ["category_id"],
    where: { ...where, category_id: { not: null } },
    _count: { category_id: true },
    orderBy: { _count: { category_id: "desc" } },
    take: limit
  });

  // Enrich with category names
  const enriched = await Promise.all(
    result.map(async (r) => {
      const category = await prisma.category.findUnique({
        where: { category_id: r.category_id! }
      });
      return {
        category_id: r.category_id,
        category_name: category?.name || "Unknown",
        count: r._count.category_id
      };
    })
  );

  return enriched;
};

export const getAssigneeWorkloadDistribution = async () => {
  const assignees = await prisma.user.findMany({
    where: { role: { in: ["ASSIGNEE", "ADMIN"] } },
    select: {
      user_id: true,
      user_name: true,
      full_name: true,
      email: true
    }
  });

  const distribution = await Promise.all(
    assignees.map(async (assignee) => {
      const activeCount = await prisma.ticket.count({
        where: {
          assignee_user_id: assignee.user_id,
          status_id: { notIn: [5, 6] }
        }
      });

      return {
        assignee_id: assignee.user_id,
        assignee_name: assignee.user_name ?? assignee.full_name ?? assignee.email,
        active_tickets: activeCount
      };
    })
  );

  return distribution.sort((a, b) => b.active_tickets - a.active_tickets);
};

export const getCategoryTrendsOverTime = async (startDate: Date, daysNum: number) => {
  // Group tickets by category and day
  const tickets = await prisma.ticket.findMany({
    where: {
      created_at: { gte: startDate },
      category_id: { not: null }
    },
    select: {
      created_at: true,
      category_id: true,
      category: { select: { name: true } }
    },
    orderBy: { created_at: "asc" }
  });

  // Group by category and date
  const trends: any = {};
  tickets.forEach(ticket => {
    const categoryName = ticket.category?.name || "Unknown";
    const dateKey = ticket.created_at.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!trends[categoryName]) {
      trends[categoryName] = {};
    }
    trends[categoryName][dateKey] = (trends[categoryName][dateKey] || 0) + 1;
  });

  return trends;
};

// Assignee Performance Functions

export const getTicketsByAssigneeAndStatuses = async (
  assigneeId: string,
  statusIds: number[],
  sortBy: string = "deadline"
) => {
  const orderBy: any = {};
  if (sortBy === "deadline") {
    orderBy.deadline = "asc";
  } else if (sortBy === "priority") {
    orderBy.priority = "desc";
  } else {
    orderBy.created_at = "desc";
  }

  return await prisma.ticket.findMany({
    where: {
      assignee_user_id: assigneeId,
      status_id: { in: statusIds }
    },
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

export const getTicketCountByAssigneeAndStatus = async (
  assigneeId: string,
  statusId: number,
  dateFilter: Date | null
) => {
  const where: any = {
    assignee_user_id: assigneeId,
    status_id: statusId
  };

  if (dateFilter) {
    where.resolved_at = { gte: dateFilter };
  }

  return await prisma.ticket.count({ where });
};

export const getAssigneeAvgResolutionTime = async (
  assigneeId: string,
  dateFilter: Date | null
) => {
  const where: any = {
    assignee_user_id: assigneeId,
    status_id: { in: [5, 6] }, // Solved (5) or Failed (6)
    resolved_at: { not: null },
    activated_at: { not: null }
  };

  if (dateFilter) {
    where.resolved_at = { ...where.resolved_at, gte: dateFilter };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      activated_at: true,
      resolved_at: true
    }
  });

  if (tickets.length === 0) return 0;

  const totalHours = tickets.reduce((sum, ticket) => {
    if (!ticket.activated_at || !ticket.resolved_at) return sum;
    const hours = (ticket.resolved_at.getTime() - ticket.activated_at.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  return parseFloat((totalHours / tickets.length).toFixed(2));
};

export const getAssigneeResolvedByCategory = async (
  assigneeId: string,
  dateFilter: Date | null
) => {
  const where: any = {
    assignee_user_id: assigneeId,
    status_id: { in: [5, 6] }, // Solved (5) or Failed (6)
    category_id: { not: null }
  };

  if (dateFilter) {
    where.resolved_at = { gte: dateFilter };
  }

  const result = await prisma.ticket.groupBy({
    by: ["category_id"],
    where,
    _count: { category_id: true }
  });

  // Enrich with category names
  const enriched = await Promise.all(
    result.map(async (r) => {
      const category = await prisma.category.findUnique({
        where: { category_id: r.category_id! }
      });
      return {
        category_name: category?.name || "Unknown",
        count: r._count.category_id
      };
    })
  );

  return enriched;
};

export const getAllActiveCategories = async () => {
  return await prisma.category.findMany({
    where: { is_active: true },
    select: { name: true, category_id: true }
  });
};

// ===== MERGE/UNMERGE SERVICE =====

export const mergeTickets = async (parentTicketId: number, childTicketIds: number[]) => {
  const merged = await Promise.all(
    childTicketIds.map((childId) =>
      prisma.ticket.update({
        where: { ticket_id: childId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { parent_ticket_id: parentTicketId } as any
      })
    )
  );

  return merged;
};

export const unmergeTicket = async (childTicketId: number) => {
  return await prisma.ticket.update({
    where: { ticket_id: childTicketId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { parent_ticket_id: null } as any
  });
};