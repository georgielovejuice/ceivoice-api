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
    console.log('[Auth] ❌ Token validation failed:', error?.message);
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  console.log('[Auth] ✅ Token valid | supabase_id:', authUser.id, '| email:', authUser.email);

  // Decode claims from already-verified JWT (app_role from custom hook)
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  console.log('[Auth] 🔑 JWT claims:', {
    app_role: claims.app_role,
    role: claims.role,
    email: claims.email,
    exp: claims.exp ? new Date(claims.exp * 1000).toISOString() : undefined,
  });

  const user = await prisma.user.findUnique({ where: { user_id: authUser.id } });
  if (!user) {
    console.log('[Auth] ❌ User not found in DB for supabase_id:', authUser.id);
    res.status(401).json({ error: 'User not found' });
    return;
  }
  console.log('[Auth] 👤 DB user:', { user_id: user.user_id, email: user.email, db_role: user.role });

  // Always prefer the DB role — JWT claims can be stale if the role was updated
  // after the token was issued (e.g. user promoted to admin).
  const rawRole = user.role ?? claims.app_role ?? 'user';
  const normalizedRole = rawRole.toUpperCase();
  console.log('[Auth] 🎭 Role resolved:', { db_role: user.role, jwt_app_role: claims.app_role, final_role: normalizedRole });

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
    console.log('[Authorize]', allowed ? '✅ PASS' : '❌ DENY', '|',
      `user role: "${userRole}" (level ${userLevel})`,
      `| required: [${allowedRoles.join(', ')}]`
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