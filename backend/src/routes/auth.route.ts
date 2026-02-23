/**
 * Authentication Routes
 * API endpoints for authentication.
 *
 * Google OAuth is now handled by Supabase (PKCE flow):
 *   GET /api/auth/google          → redirect the browser to Supabase's OAuth URL
 *   GET /api/auth/google/callback → Supabase redirects here after Google auth;
 *                                   exchange the one-time code for a session,
 *                                   upsert the user in our DB, then issue our
 *                                   own JWTs and redirect to the frontend.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import * as authService from "../services/auth.service";
import { authenticate } from "../middlewares/auth.middleware";
import config from "../config/environment";

const router = Router();
const prisma = new PrismaClient();

// ===== SUPABASE SERVER CLIENT FACTORY =====
/**
 * Creates a per-request Supabase client that reads/writes cookies.
 * This is required for the server-side PKCE flow — Supabase stores the
 * code_verifier in a cookie between the initiation and callback steps.
 */
function createSupabaseClient(req: Request, res: Response) {
  return createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? "").map(({ name, value }) => ({
          name,
          value: value ?? ""
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.appendHeader(
            "Set-Cookie",
            serializeCookieHeader(name, value, options)
          );
        });
      }
    }
  });
}

// ===== PUBLIC ROUTES =====

/**
 * POST /api/auth/register
 * Register new user with email and password
 * Body: { fullName: string, email: string, password: string, confirmPassword: string }
 * Returns: { accessToken: string, refreshToken: string, user: UserProfile }
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 * Body: { email: string, password: string }
 * Returns: { accessToken: string, refreshToken: string, user: UserProfile }
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token
 * Body: { refreshToken: string }
 * Returns: { accessToken: string, user: UserProfile }
 */
router.post("/refresh", authController.refresh);

// ===== GOOGLE OAUTH (via Supabase) =====

/**
 * GET /api/auth/google
 * Initiate Google OAuth via Supabase.
 * Supabase generates a PKCE code challenge and returns the Google OAuth URL.
 * The code_verifier is stored in an httpOnly cookie automatically.
 */
router.get("/google", async (req: Request, res: Response) => {
  const supabase = createSupabaseClient(req, res);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: config.supabase.callbackURL,
      // skipBrowserRedirect: true causes the SDK to return the URL rather than
      // navigating — we redirect manually so we control the response.
      skipBrowserRedirect: true,
      queryParams: { access_type: "offline", prompt: "consent" }
    }
  });

  if (error || !data.url) {
    console.error("Supabase OAuth init error:", error);
    return res.redirect(`${config.api.frontendUrl}/login?error=oauth_failed`);
  }

  return res.redirect(data.url);
});

/**
 * GET /api/auth/google/callback
 * Supabase redirects here with a one-time ?code= after the user approves.
 * We exchange the code for a Supabase session (PKCE verifier is read from
 * the cookie set in the previous step), extract user info, upsert the user
 * in our database, then issue our own JWT tokens and redirect to the frontend.
 *
 * Tokens are passed as query params only for this one-time server→frontend
 * redirect — the Next.js /callback page stores them in httpOnly cookies and
 * immediately redirects to /auth-success, so they never appear in history.
 */
router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.redirect(`${config.api.frontendUrl}/login?error=auth_failed`);
  }

  const supabase = createSupabaseClient(req, res);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Supabase code exchange error:", error);
    return res.redirect(`${config.api.frontendUrl}/login?error=auth_failed`);
  }

  const supabaseUser = data.user;
  const email = supabaseUser.email ?? "";
  // Supabase stores the provider's user id in user_metadata.provider_id for
  // non-email providers, and the Supabase user UUID is always supabaseUser.id.
  const googleId =
    (supabaseUser.user_metadata?.provider_id as string | undefined) ??
    supabaseUser.id;
  const name =
    (supabaseUser.user_metadata?.full_name as string | undefined) ??
    (supabaseUser.user_metadata?.name as string | undefined) ??
    null;

  try {
    // Upsert: find by Google provider id, then by email, else create.
    let user = await prisma.user.findUnique({ where: { google_id: googleId } });

    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Link the Google account to an existing email/password account.
        user = await prisma.user.update({
          where: { email },
          data: { google_id: googleId }
        });
      } else {
        user = await prisma.user.create({
          data: { email, name, google_id: googleId, role: "USER" }
        });
      }
    }

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    const accessToken = authService.generateAccessToken(payload);
    const refreshToken = authService.generateRefreshToken(payload);

    return res.redirect(
      `${config.api.frontendUrl}/callback?access_token=${accessToken}&refresh_token=${refreshToken}`
    );
  } catch (dbErr) {
    console.error("OAuth DB upsert error:", dbErr);
    return res.redirect(`${config.api.frontendUrl}/login?error=server_error`);
  }
});

// ===== PROTECTED ROUTES =====

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Requires: Valid JWT token in Authorization header (Bearer <token>)
 * Returns: { user_id: number, email: string, name: string, role: string, is_assignee: boolean, created_at: Date }
 */
router.get("/me", authenticate, authController.me);

/**
 * POST /api/auth/logout
 * Logout current user
 * Requires: Valid JWT token in Authorization header
 * Note: In stateless JWT auth, logout is client-side (delete tokens)
 */
router.post("/logout", authenticate, authController.logout);

export default router;
