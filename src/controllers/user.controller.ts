import { Request, Response } from "express";
import * as dbService from "../services/db.service";

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    const user = await dbService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user by email
export const getUserByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const user = await dbService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const userId = parseInt(user_id);

    const notifications = await dbService.getUserNotifications(userId);

    res.json(notifications);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notification_id } = req.params;
    const notificationId = parseInt(notification_id);

    const notification = await dbService.markNotificationAsRead(notificationId);

    res.json({
      message: "Notification marked as read",
      notification
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
