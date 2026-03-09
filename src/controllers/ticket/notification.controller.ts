import { Request, Response } from "express";
import * as db from "../../repositories";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const notifications = await db.getUserNotifications(req.user.user_id);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationId = Number.parseInt(req.params.id, 10);
    await db.markNotificationAsRead(notificationId);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await db.markAllNotificationsAsRead(req.user.user_id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationId = Number.parseInt(req.params.id, 10);
    await db.deleteNotification(notificationId);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addFollower = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const ticketId = Number.parseInt(req.params.id, 10);
    await db.addFollower(ticketId, req.user.user_id);
    res.json({ message: "Follower added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = Number.parseInt(req.params.id, 10);
    const followers = await db.getFollowers(ticketId);
    res.json(followers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
