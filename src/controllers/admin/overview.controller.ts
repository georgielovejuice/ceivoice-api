import { Request, Response } from "express";
import * as db from "../../repositories";
import { STATUS_ID } from "../../constants/ticketStatus";

export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const listAllTickets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await db.getAllTickets();
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

export const listActiveTickets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await db.getTicketsByStatus(STATUS_ID.NEW);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTicketStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await db.getTicketStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notifications = await db.getUserNotifications(req.user.user_id);
    res.json(notifications);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notificationId = Number.parseInt(req.params.id, 10);
    await db.markNotificationAsRead(notificationId);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(500).json({ error: error.message });
  }
};
