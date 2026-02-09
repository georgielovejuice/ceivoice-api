/**
 * Authentication Middleware
 * Passport.js integration for route protection
 * - JWT Bearer token validation
 * - Role-based authorization
 * - Optional authentication
 */

import { Request, Response, NextFunction } from "express";
import passport from "passport";
import type { UserProfile } from "../config/passport";

// ===== JWT AUTHENTICATION MIDDLEWARE =====

/**
 * Authenticate using JWT Bearer token
 * Expected header: Authorization: Bearer <token>
 * Requires valid JWT token in Authorization header
 */
export const authenticate = (req: any, res: Response, next: NextFunction): void => {
  passport.authenticate("jwt", { session: false }, (err: any, user: UserProfile | false, info: any) => {
    if (err) {
      return res.status(500).json({ error: "Authentication error" });
    }

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: info?.message || "Invalid or missing token"
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.user_id;
    req.email = user.email;

    next();
  })(req, res, next);
};

/**
 * Optional JWT authentication
 * Attaches user if valid token provided, otherwise continues
 */
export const authenticateOptional = (req: any, res: Response, next: NextFunction): void => {
  passport.authenticate("jwt", { session: false }, (err: any, user: UserProfile | false) => {
    if (err) {
      console.error("Optional auth error:", err);
      return next();
    }

    if (user) {
      req.user = user;
      req.userId = user.user_id;
      req.email = user.email;
    }

    next();
  })(req, res, next);
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
