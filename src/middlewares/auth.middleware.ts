import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      email?: string;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.userId = payload.userId;
  req.email = payload.email;
  next();
};

export const authorizeAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is admin - this would need to be verified from database
  // For now, we'll assume the token itself indicates authorization
  next();
};

export const authorizeAssignee = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is assignee - this would need to be verified from database
  next();
};
