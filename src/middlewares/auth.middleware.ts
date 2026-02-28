/**
 * Authentication Middleware
 * Supabase + JWT-based route protection (no Passport.js)
 * - JWT Bearer token validation via jsonwebtoken
 * - Role-based authorization
 * - Optional authentication
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import type { UserProfile } from "../types";
import { verifyToken } from "../services/auth.service";

const prisma = new PrismaClient();

// ===== HELPERS =====

/** Extract Bearer token from the Authorization header, or return null. */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

// ===== JWT AUTHENTICATION MIDDLEWARE =====

/**
 * Authenticate using JWT Bearer token.
 * Expected header: Authorization: Bearer <token>
 *
 * Verifies the token cryptographically, then confirms the user still exists
 * in the database (so deactivated accounts cannot use old tokens).
 */
export const authenticate = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req);

  if (!token) {
    res.status(401).json({ error: "Unauthorized", message: "Missing token" });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { user_id: payload.user_id } });

    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }

    const userProfile: UserProfile = {
      user_id: user.user_id,
      email: user.email,
      user_name: user.user_name,
      role: user.role
    };

    req.user = userProfile;
    req.userId = user.user_id;
    req.email = user.email;

    next();
  } catch (err) {
    console.error("Auth middleware DB error:", err);
    res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Optional JWT authentication.
 * Attaches the user if a valid token is provided; otherwise continues.
 */
export const authenticateOptional = async (
  req: any,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req);

  if (!token) {
    next();
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { user_id: payload.user_id } });

    if (user) {
      const userProfile: UserProfile = {
        user_id: user.user_id,
        email: user.email,
        user_name: user.user_name,
        role: user.role
      };
      req.user = userProfile;
      req.userId = user.user_id;
      req.email = user.email;
    }
  } catch (err) {
    console.error("Optional auth middleware DB error:", err);
  }

  next();
};

// ===== AUTHORIZATION MIDDLEWARE =====

/**
 * Role-based authorization
 * Restricts access to specified roles
 * Must be used after authenticate middleware
 *
 * Example: authorize(["ADMIN", "ASSIGNEE"])
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRole = (req.user as any)?.role;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: "Forbidden",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`
      });
      return;
    }

    next();
  };
};

/**
 * Require specific role
 * Convenience wrapper for single role check
 */
export const requireRole = (role: string) => {
  return authorize([role]);
};

/**
 * Require Admin access
 * Shorthand for authorize(["ADMIN"])
 */
export const requireAdmin = (req: any, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!["ADMIN"].includes((req.user as any)?.role)) {
    res.status(403).json({
      error: "Forbidden",
      message: "This action requires admin privileges"
    });
    return;
  }

  next();
};

/**
 * Assignee or Admin access
 * Shorthand for authorize(["ASSIGNEE", "ADMIN"])
 */
export const requireAssignee = (req: any, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userRole = (req.user as any)?.role;
  if (!["ASSIGNEE", "ADMIN"].includes(userRole)) {
    res.status(403).json({
      error: "Forbidden",
      message: "This action requires assignee or admin privileges"
    });
    return;
  }

  next();
};
