import { Request, Response } from "express";
import * as dbService from "../services/db.service";
import * as oauthService from "../services/oauth.service";
import * as authService from "../services/auth.service";
import * as validator from 'email-validator';
import dotenv from 'dotenv';

dotenv.config();

// EP01: Register with email and password
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validator.validate(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create user in Supabase database
    const user = await dbService.createUserWithPassword(email, hashedPassword, fullName);

    // Generate JWT token
    const token = authService.generateToken(user.userId, user.email);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        is_assignee: user.isAssignee
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP02: Login with email and password
export const loginWithPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return res.status(401).json({ error: "Please use Google sign-in for this account" });
    }

    // Verify password
    const isPasswordValid = await authService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = authService.generateToken(user.userId, user.email);

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        is_assignee: user.isAssignee
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// EP01-ST004: Google OAuth Login
export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    const authUrl = oauthService.getAuthUrl();
    res.json({ auth_url: authUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    // Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForToken(code as string);

    if (!tokens.access_token) {
      return res.status(400).json({ error: "Failed to get access token" });
    }

    // Get user info
    const userInfo = await oauthService.getUserInfo(tokens.access_token);

    // Get or create user
    const user = await dbService.getOrCreateUser(
      userInfo.email || '',
      userInfo.name || undefined,
      userInfo.id || undefined
    );

    // Save OAuth token
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;
    const refreshToken = tokens.refresh_token ?? undefined;
    await dbService.saveOAuthToken(
      user.userId,
      tokens.access_token,
      refreshToken,
      expiresAt
    );

    // Generate JWT token
    const jwtToken = authService.generateToken(user.userId, user.email);

    res.json({
      message: "Authentication successful",
      token: jwtToken,
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Simple login with email (for non-OAuth)
export const emailLogin = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get or create user
    const user = await dbService.getOrCreateUser(email, name);

    // Generate JWT token
    const token = authService.generateToken(user.userId, user.email);

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get current user info
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await dbService.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user_id: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      is_assignee: user.isAssignee
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
