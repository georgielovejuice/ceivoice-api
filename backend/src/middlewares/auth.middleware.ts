import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";

export interface AuthPayload {
  user_id: number;
  email: string;
  role: "USER" | "ASSIGNEE" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      userId?: number;
      email?: string;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    
    req.user = decoded as AuthPayload;
    req.userId = decoded.user_id;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden - Insufficient permissions" });
      return;
    }
    next();
  };
};

export const authenticateOptional = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded as AuthPayload;
      req.userId = decoded.user_id;
      req.email = decoded.email;
    }
  } catch (err) {
    // Ignore errors for optional auth
  }

  next();
};
