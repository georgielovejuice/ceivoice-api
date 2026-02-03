import { Request, Response } from "express";
import * as dbService from "../services/db.service";

// EP06-ST001: Manage Assignee Roles
export const toggleAssigneeRole = async (req: Request, res: Response) => {
  try {
    const { user_id, is_assignee } = req.body;

    if (user_id === undefined || is_assignee === undefined) {
      return res.status(400).json({ error: "user_id and is_assignee are required" });
    }

    const user = await dbService.toggleAssigneeRole(user_id, is_assignee);

    res.json({
      message: `User ${is_assignee ? 'granted' : 'revoked'} assignee role`,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP06-ST002: Define Assignee Scope
export const assignScope = async (req: Request, res: Response) => {
  try {
    const { user_id, scope_name } = req.body;

    if (!user_id || !scope_name) {
      return res.status(400).json({ error: "user_id and scope_name are required" });
    }

    const scope = await dbService.assignScope(user_id, scope_name);

    res.status(201).json({
      message: "Scope assigned successfully",
      scope
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeScope = async (req: Request, res: Response) => {
  try {
    const { user_id, scope_name } = req.body;

    if (!user_id || !scope_name) {
      return res.status(400).json({ error: "user_id and scope_name are required" });
    }

    await dbService.removeScope(user_id, scope_name);

    res.json({
      message: "Scope removed successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAssigneeScopes = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    const scopes = await dbService.getAssigneeScopes(userId);

    res.json(scopes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP06-ST003: Admin Report Dashboard
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (start_date) startDate = new Date(start_date as string);
    if (end_date) endDate = new Date(end_date as string);

    const stats = await dbService.getTicketStats(startDate, endDate);

    // Get additional metrics
    const allTickets = await dbService.getTicketsByStatus("New");

    res.json({
      period: {
        start: startDate,
        end: endDate
      },
      total_tickets: stats.totalTickets,
      by_status: stats.byStatus,
      by_category: stats.byCategory,
      all_tickets: allTickets.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP06-ST004: Assignee Personal Reports
export const getAssigneeMetrics = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const { days } = req.query;
    const userId = parseInt(user_id);
    const daysPeriod = days ? parseInt(days as string) : 30;

    const metrics = await dbService.getAssigneeMetrics(userId, daysPeriod);

    res.json({
      assignee_id: userId,
      period_days: daysPeriod,
      metrics
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP06-ST005: Complete Audit Trail
export const getAuditTrail = async (req: Request, res: Response) => {
  try {
    const { ticket_id } = req.params;
    const ticketId = parseInt(ticket_id);

    const statusHistory = await dbService.getStatusHistory(ticketId);
    const assignmentHistory = await dbService.getAssignmentHistory(ticketId);

    res.json({
      ticket_id: ticketId,
      status_changes: statusHistory,
      assignment_changes: assignmentHistory
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all assignees
export const getAllAssignees = async (req: Request, res: Response) => {
  try {
    const assignees = await dbService.getAllAssignees();

    res.json(assignees);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
