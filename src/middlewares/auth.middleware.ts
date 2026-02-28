// ceivoice-api/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import config from '../config/environment';

const prisma = new PrismaClient();

interface SupabaseJwt {
  sub: string;
  email: string;
  app_role?: string;
  exp: number;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  let payload: SupabaseJwt;
  try {
    payload = jwt.verify(token, config.supabase.jwtSecret, {
      algorithms: ['HS256'],
    }) as SupabaseJwt;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { user_id: payload.sub } });
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = {
    user_id: user.user_id,
    email: user.email,
    user_name: user.user_name,
    role: payload.app_role ?? user.role,
  };
  next();
};

const ROLE_HIERARCHY: Record<string, number> = { user: 0, assignee: 1, admin: 2 };

export const authorize = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toLowerCase();
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
    const allowed = allowedRoles.some(
      r => userLevel >= (ROLE_HIERARCHY[r.toLowerCase()] ?? 99)
    );
    if (!allowed) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};

export const requireAdmin = authorize(['admin']);
export const requireAssignee = authorize(['assignee']);