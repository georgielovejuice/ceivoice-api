import { Request, Response } from "express";
import * as dbService from "../services/db.service";

// ===== ADMIN REPORTING =====
// REP-ADM-001: Global Dashboard View
// REP-ADM-002: Trend Analysis

export const getAdminMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { period } = req.query; // 'last_7_days', 'last_30_days', 'all_time'

    let dateFilter: Date | null = null;
    if (period === "last_7_days") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === "last_30_days") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // Total Ticket Volume
    const totalTickets = await dbService.getTicketCount(dateFilter);

    // Tickets by Status (for backlog analysis)
    const ticketsByStatus = await dbService.getTicketCountByStatus(dateFilter);

    // Average Resolution Time (in hours)
    const avgResolutionTime = await dbService.getAverageResolutionTime(dateFilter);

    // Top Categories (volume trends)
    const topCategories = await dbService.getTopCategories(dateFilter, 5);

    // Current Backlog (New + Assigned + Solving + Renew)
    // Status IDs: New=2, Assigned=3, Solving=4, Renew=7
    const backlogStatusIds = [2, 3, 4, 7];
    const currentBacklog = await dbService.getTicketCountByStatuses(backlogStatusIds);

    // Assignee Workload Distribution
    const assigneeWorkload = await dbService.getAssigneeWorkloadDistribution();

    res.json({
      period: period || "all_time",
      metrics: {
        total_tickets: totalTickets,
        tickets_by_status: ticketsByStatus,
        avg_resolution_time_hours: avgResolutionTime,
        top_categories: topCategories,
        current_backlog: currentBacklog,
        assignee_workload: assigneeWorkload
      },
      generated_at: new Date()
    });
  } catch (err) {
    console.error("Error generating admin metrics:", err);
    res.status(500).json({ error: "Failed to generate admin metrics" });
  }
};

export const getCategoryTrends = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { days } = req.query;
    const daysNum = Number.parseInt(days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const trends = await dbService.getCategoryTrendsOverTime(startDate, daysNum);

    res.json({
      period_days: daysNum,
      start_date: startDate,
      trends
    });
  } catch (err) {
    console.error("Error fetching category trends:", err);
    res.status(500).json({ error: "Failed to fetch category trends" });
  }
};

// ===== ASSIGNEE REPORTING =====
// REP-ASG-001: Workload Dashboard
// REP-ASG-002: Personal Performance

export const getAssigneeWorkload = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.user.user_id;
    const { sort_by } = req.query; // 'deadline', 'priority', 'created_at'

    // Get active tickets assigned to this user (excluding Solved/Failed)
    // Status IDs: New=2, Assigned=3, Solving=4, Renew=7
    const activeStatusIds = [2, 3, 4, 7];
    const activeTickets = await dbService.getTicketsByAssigneeAndStatuses(
      userId,
      activeStatusIds,
      sort_by as string || "deadline"
    );

    // Count by status
    const statusBreakdown = activeTickets.reduce((acc: any, ticket: any) => {
      const statusKey = ticket.status?.name || "Unknown";
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {});

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = activeTickets.filter((t: any) => {
      if (!t.deadline) return false;
      const daysUntil = Math.ceil(
        (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= 7;
    });

    // Overdue tickets
    const overdueTickets = activeTickets.filter((t: any) => {
      if (!t.deadline) return false;
      return new Date(t.deadline) < new Date();
    });

    res.json({
      assignee_id: userId,
      workload: {
        total_active_tickets: activeTickets.length,
        status_breakdown: statusBreakdown,
        upcoming_deadlines_count: upcomingDeadlines.length,
        overdue_count: overdueTickets.length
      },
      tickets: activeTickets,
      sort_by: sort_by || "deadline"
    });
  } catch (err) {
    console.error("Error fetching assignee workload:", err);
    res.status(500).json({ error: "Failed to fetch workload" });
  }
};

export const getAssigneePerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userId = req.user.user_id;
    const { period } = req.query; // 'last_7_days', 'last_30_days', 'all_time'

    let dateFilter: Date | null = null;
    if (period === "last_7_days") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === "last_30_days") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // Total tickets solved by this assignee
    const totalSolved = await dbService.getTicketCountByAssigneeAndStatus(
      userId,
      5, // Status ID for Solved
      dateFilter
    );

    // Total tickets failed by this assignee
    const totalFailed = await dbService.getTicketCountByAssigneeAndStatus(
      userId,
      6, // Status ID for Failed
      dateFilter
    );

    // Average resolution time for this assignee
    const avgResolutionTime = await dbService.getAssigneeAvgResolutionTime(
      userId,
      dateFilter
    );

    // Tickets resolved per category
    const resolvedByCategory = await dbService.getAssigneeResolvedByCategory(
      userId,
      dateFilter
    );

    res.json({
      assignee_id: userId,
      period: period || "all_time",
      performance: {
        total_solved: totalSolved,
        total_failed: totalFailed,
        success_rate: totalSolved + totalFailed > 0
          ? ((totalSolved / (totalSolved + totalFailed)) * 100).toFixed(2) + "%"
          : "N/A",
        avg_resolution_time_hours: avgResolutionTime,
        resolved_by_category: resolvedByCategory
      },
      generated_at: new Date()
    });
  } catch (err) {
    console.error("Error fetching assignee performance:", err);
    res.status(500).json({ error: "Failed to fetch performance metrics" });
  }
};
