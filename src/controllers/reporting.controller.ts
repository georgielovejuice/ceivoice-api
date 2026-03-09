import { Request, Response } from "express";
import * as db from "../repositories";
import { STATUS_ID, ACTIVE_STATUS_IDS } from "../constants/ticketStatus";

// ===== ADMIN REPORTING =====

export const getAdminMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;

    let dateFilter: Date | null = null;
    if (period === "last_7_days")  { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 7); }
    else if (period === "last_30_days") { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 30); }

    const [totalTickets, ticketsByStatus, avgResolutionTime, topCategories, currentBacklog, assigneeWorkload] = await Promise.all([
      db.getTicketCount(dateFilter),
      db.getTicketCountByStatus(dateFilter),
      db.getAverageResolutionTime(dateFilter),
      db.getTopCategories(dateFilter, 5),
      db.getTicketCountByStatuses([...ACTIVE_STATUS_IDS]),
      db.getAssigneeWorkloadDistribution(),
    ]);

    res.json({
      period: period || "all_time",
      metrics: { total_tickets: totalTickets, tickets_by_status: ticketsByStatus, avg_resolution_time_hours: avgResolutionTime, top_categories: topCategories, current_backlog: currentBacklog, assignee_workload: assigneeWorkload },
      generated_at: new Date()
    });
  } catch (err) {
    console.error("Error generating admin metrics:", err);
    res.status(500).json({ error: "Failed to generate admin metrics" });
  }
};

export const getCategoryTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const daysNum   = Number.parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const trends = await db.getCategoryTrendsOverTime(startDate, daysNum);
    res.json({ period_days: daysNum, start_date: startDate, trends });
  } catch (err) {
    console.error("Error fetching category trends:", err);
    res.status(500).json({ error: "Failed to fetch category trends" });
  }
};

// ===== ASSIGNEE REPORTING =====

export const getAssigneeWorkload = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const userId  = req.user.user_id;
    const sort_by = req.query.sort_by as string | undefined;

    const activeTickets = await db.getTicketsByAssigneeAndStatuses(userId, [...ACTIVE_STATUS_IDS], sort_by || "deadline");

    const statusBreakdown = activeTickets.reduce((acc: any, ticket: any) => {
      const key = ticket.status?.name || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const upcomingDeadlines = activeTickets.filter((t: any) => {
      if (!t.deadline) return false;
      const daysUntil = Math.ceil((new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    const overdueTickets = activeTickets.filter((t: any) => t.deadline && new Date(t.deadline) < new Date());

    res.json({
      assignee_id: userId,
      workload: { total_active_tickets: activeTickets.length, status_breakdown: statusBreakdown, upcoming_deadlines_count: upcomingDeadlines.length, overdue_count: overdueTickets.length },
      tickets: activeTickets,
      sort_by: sort_by || "deadline"
    });
  } catch (err) {
    console.error("Error fetching assignee workload:", err);
    res.status(500).json({ error: "Failed to fetch workload" });
  }
};

export const getAssigneePerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const userId = req.user.user_id;
    const { period } = req.query;

    let dateFilter: Date | null = null;
    if (period === "last_7_days")  { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 7); }
    else if (period === "last_30_days") { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 30); }

    const [totalSolved, totalFailed, avgResolutionTime, resolvedByCategory] = await Promise.all([
      db.getTicketCountByAssigneeAndStatus(userId, STATUS_ID.SOLVED, dateFilter),
      db.getTicketCountByAssigneeAndStatus(userId, STATUS_ID.FAILED, dateFilter),
      db.getAssigneeAvgResolutionTime(userId, dateFilter),
      db.getAssigneeResolvedByCategory(userId, dateFilter),
    ]);

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

// ===== AI ACCURACY REPORTING =====

export const getAiAccuracyMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period } = req.query;

    let dateFilter: Date | null = null;
    if (period === "last_7_days")       { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 7); }
    else if (period === "last_30_days") { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 30); }
    else if (period === "last_90_days") { dateFilter = new Date(); dateFilter.setDate(dateFilter.getDate() - 90); }

    const metrics = await db.getAiAccuracyMetrics(dateFilter);
    res.json({ period: period || "all_time", metrics, generated_at: new Date() });
  } catch (err) {
    console.error("Error fetching AI accuracy metrics:", err);
    res.status(500).json({ error: "Failed to fetch AI accuracy metrics" });
  }
};
