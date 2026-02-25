/**
 * Supabase Configuration
 * Server-side Supabase client setup for OAuth and admin operations.
 *
 * Two clients are exported:
 *  - supabaseAdmin  — uses the service-role key; bypasses Row-Level Security.
 *                     Use only for trusted server-side operations.
 *  - supabaseAnon   — uses the anon/public key; used in the OAuth PKCE flow so
 *                     that auth state is scoped per-request.
 */

import { createClient } from "@supabase/supabase-js";
import config from "./environment";

// ===== ADMIN CLIENT =====
// Service-role key — full Supabase privileges, never exposed to the browser.
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ===== ANONYMOUS CLIENT =====
// Anon key — used for the OAuth PKCE exchange on behalf of anonymous users.
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ===== SHARED TYPES =====
// These interfaces are imported by services, controllers, and middlewares.

/** Payload stored inside every JWT we issue. */
export interface JwtPayload {
  user_id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/** Lean user object attached to req.user after successful authentication. */
export interface UserProfile {
  user_id: number;
  email: string;
  name: string | null;
  role: string;
}

// Augment Express's Request so TypeScript knows the shape of req.user
// (previously provided by @types/passport, now declared here directly).
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
      userId?: number;
      email?: string;
    }
  }
}
