/**
 * Authentication Controller
 * Handles all authentication-related HTTP requests
 * - User registration and login
 * - Token refresh
 * - User profile retrieval
 */

import { Request, Response } from "express";
import * as authService from "../services/auth.service";

// ===== EMAIL/PASSWORD REGISTRATION =====

/**
 * Register new user with email and password
 * Body: { fullName, email, password, confirmPassword }
 * Returns: { accessToken, refreshToken, user }
 */
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

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
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
    console.error("Registration error:", err);
    res.status(400).json({ error: error.message });
  }
};

// ===== EMAIL/PASSWORD LOGIN =====

/**
 * Login with email and password
 * Body: { email, password }
 * Returns: { accessToken, refreshToken, user }
 */
export const login = async (
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
    console.error("Login error:", err);
    res.status(401).json({ error: error.message || "Invalid credentials" });
  }
};

// ===== REFRESH TOKEN =====

/**
 * Refresh access token using refresh token
 * Body: { refreshToken }
 * Returns: { accessToken, user }
 */
export const refresh = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    const error = err as Error;
    console.error("Token refresh error:", err);
    res.status(401).json({ error: error.message || "Failed to refresh token" });
  }
};

// ===== GET CURRENT USER =====

/**
 * Get current authenticated user profile
 * Requires: Valid JWT token in Authorization header
 * Returns: { user_id, email, name, role, is_assignee, created_at }
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await authService.getUserById((req.user as any).user_id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_assignee: user.role === "ASSIGNEE" || user.role === "ADMIN",
      created_at: user.created_at
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===== LOGOUT (OPTIONAL) =====

/**
 * Logout user
 * In JWT-based auth, logout is handled client-side by deleting tokens
 * This endpoint can be used for server-side token blacklisting if needed
 */
export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // In stateless JWT auth, logout is client-side
    // This endpoint exists for API consistency
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
