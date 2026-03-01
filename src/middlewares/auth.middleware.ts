// ceivoice-api/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import config from '../config/environment';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

  // Validate token against Supabase Auth (works with HS256 and ES256)
  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Decode claims from already-verified JWT (app_role from custom hook)
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

  const user = await prisma.user.findUnique({ where: { user_id: authUser.id } });
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const rawRole = claims.app_role ?? user.role ?? 'user';
  const normalizedRole = rawRole.toUpperCase();
  console.debug('[Auth] user_id:', user.user_id, '| db role:', user.role, '| claims.app_role:', claims.app_role, '| resolved role:', normalizedRole);
  req.user = {
    user_id: user.user_id,
    email: user.email,
    user_name: user.user_name,
    role: normalizedRole,
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