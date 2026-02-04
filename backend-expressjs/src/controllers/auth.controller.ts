import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as authService from "../services/auth.service";

const prisma = new PrismaClient();

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      res.status(400).json({ error: "id_token required" });
      return;
    }

    const result = await authService.googleLogin(id_token);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid Google token" });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        email: true,
        name: true,
        role: true,
        created_at: true
      }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
