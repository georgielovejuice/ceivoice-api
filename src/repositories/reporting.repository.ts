import prisma from "../lib/prisma";

export const getTicketStats = async (startDate?: Date, endDate?: Date) => {
  const where =
    startDate && endDate
      ? { created_at: { gte: startDate, lte: endDate } }
      : {};

  const [totalTickets, byStatus, byCategory] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ["status_id"], where, _count: true }),
    prisma.ticket.groupBy({ by: ["category_id"], where, _count: true })
  ]);

  return { totalTickets, byStatus, byCategory };
};

export const getAssigneeMetrics = async (assigneeId: string, days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [currentTickets, solvedTickets, failedTickets] = await Promise.all([
    prisma.ticket.count({
      where: { assignee_user_id: assigneeId, status_id: { notIn: [5, 6] } }
    }),
    prisma.ticket.count({
      where: { assignee_user_id: assigneeId, status_id: 5, updated_at: { gte: startDate } }
    }),
    prisma.ticket.count({
      where: { assignee_user_id: assigneeId, status_id: 6, updated_at: { gte: startDate } }
    })
  ]);

  return { currentTickets, solvedTickets, failedTickets };
};

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
  return result.map((r) => ({ status_id: r.status_id, count: r._count.status_id }));
};

export const getTicketCountByStatuses = async (statusIds: number[]) => {
  return await prisma.ticket.count({
    where: { status_id: { in: statusIds } }
  });
};

export const getAverageResolutionTime = async (dateFilter: Date | null) => {
  const where: any = {
    status_id: { in: [5, 6] }, // Solved (5) or Failed (6)
  };

  if (dateFilter) {
    where.updated_at = { gte: dateFilter };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: { activated_at: true, created_at: true, resolved_at: true, updated_at: true }
  });

  if (tickets.length === 0) return 0;

  const totalHours = tickets.reduce((sum, ticket) => {
    const end   = ticket.resolved_at ?? ticket.updated_at;
    const start = ticket.activated_at ?? ticket.created_at;
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return sum + Math.max(0, hours);
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

  return await Promise.all(
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
};

export const getAssigneeWorkloadDistribution = async () => {
  const assignees = await prisma.user.findMany({
    where: { role: "ASSIGNEE" },
    select: { user_id: true, user_name: true, full_name: true, email: true }
  });

  const distribution = await Promise.all(
    assignees.map(async (assignee) => {
      const activeCount = await prisma.ticket.count({
        where: { assignee_user_id: assignee.user_id, status_id: { notIn: [5, 6] } }
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
  const tickets = await prisma.ticket.findMany({
    where: { created_at: { gte: startDate }, category_id: { not: null } },
    select: {
      created_at: true,
      category_id: true,
      category: { select: { name: true } }
    },
    orderBy: { created_at: "asc" }
  });

  const trends: any = {};
  tickets.forEach((ticket) => {
    const categoryName = ticket.category?.name || "Unknown";
    const dateKey = ticket.created_at.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!trends[categoryName]) trends[categoryName] = {};
    trends[categoryName][dateKey] = (trends[categoryName][dateKey] || 0) + 1;
  });

  return trends;
};

export const getTicketCountByAssigneeAndStatus = async (
  assigneeId: string,
  statusId: number,
  dateFilter: Date | null
) => {
  const where: any = { assignee_user_id: assigneeId, status_id: statusId };
  if (dateFilter) where.resolved_at = { gte: dateFilter };
  return await prisma.ticket.count({ where });
};

export const getAssigneeAvgResolutionTime = async (
  assigneeId: string,
  dateFilter: Date | null
) => {
  const where: any = {
    assignee_user_id: assigneeId,
    status_id: { in: [5, 6] },
    resolved_at: { not: null },
    activated_at: { not: null }
  };
  if (dateFilter) where.resolved_at = { ...where.resolved_at, gte: dateFilter };

  const tickets = await prisma.ticket.findMany({
    where,
    select: { activated_at: true, resolved_at: true }
  });

  if (tickets.length === 0) return 0;

  const totalHours = tickets.reduce((sum, ticket) => {
    if (!ticket.activated_at || !ticket.resolved_at) return sum;
    return sum + (ticket.resolved_at.getTime() - ticket.activated_at.getTime()) / (1000 * 60 * 60);
  }, 0);

  return parseFloat((totalHours / tickets.length).toFixed(2));
};

export const getAssigneeResolvedByCategory = async (
  assigneeId: string,
  dateFilter: Date | null
) => {
  const where: any = {
    assignee_user_id: assigneeId,
    status_id: { in: [5, 6] },
    category_id: { not: null }
  };
  if (dateFilter) where.resolved_at = { gte: dateFilter };

  const result = await prisma.ticket.groupBy({
    by: ["category_id"],
    where,
    _count: { category_id: true }
  });

  return await Promise.all(
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
};
