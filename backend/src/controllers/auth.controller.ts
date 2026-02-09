import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import * as dbService from "../services/db.service";
import * as validator from "email-validator";

// ===== GOOGLE OAUTH LOGIN =====
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
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

// ===== EMAIL/PASSWORD REGISTRATION =====
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    if (!validator.validate(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: "Password must be at least 6 characters long"
      });
      return;
    }

    const result = await authService.registerWithPassword(
      email,
      password,
      fullName
    );
    res.status(201).json(result);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(400).json({ error: error.message });
  }
};

// ===== EMAIL/PASSWORD LOGIN =====
export const loginWithPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await authService.loginWithPassword(email, password);
    res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error(err);
    res.status(401).json({ error: error.message || "Invalid credentials" });
  }
};

// ===== GET CURRENT USER =====
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await authService.getUserById(req.user.user_id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_assignee: user.is_assignee,
      created_at: user.created_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
