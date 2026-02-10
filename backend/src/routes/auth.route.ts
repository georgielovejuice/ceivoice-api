/**
 * Authentication Routes
 * Production-grade API endpoints for authentication
 */

import { Router } from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller";
import * as authService from "../services/auth.service";
import { authenticate } from "../middlewares/auth.middleware";
import config from "../config/environment";

const router = Router();

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

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 * Redirects to Google login
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 * Redirects back to client with tokens
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login"
  }),
  (req, res) => {
    // On success, user is in req.user
    if (req.user) {
      const user = req.user as any;

      // Generate tokens
      const payload = {
        user_id: user.user_id,
        email: user.email,
        role: user.role
      };

      const accessToken = authService.generateAccessToken(payload);
      const refreshToken = authService.generateRefreshToken(payload);

      // Redirect to frontend with tokens
      res.redirect(
        `${config.api.frontendUrl}/auth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    } else {
      res.redirect(`${config.api.frontendUrl}/login?error=auth_failed`);
    }
  }
);

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
