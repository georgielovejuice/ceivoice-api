/**
 * Authentication Service
 * Production-grade auth utilities with Passport.js integration
 * - Token management (generation, verification, refresh)
 * - Password hashing with bcrypt
 * - User registration and validation
 */

import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/environment";
import { JwtPayload, UserProfile } from "../config/passport";

const prisma = new PrismaClient();

// ===== INTERFACES =====

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: string;
}

export interface TrackingTokenPayload {
  email: string;
  request_id: number;
}

// ===== PASSWORD HASHING =====

/**
 * Hash password with bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.auth.bcryptRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Promise<boolean> - True if passwords match
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// ===== JWT TOKEN OPERATIONS =====

/**
 * Generate Access Token (short-lived)
 * @param payload - Token payload with user info
 * @returns string - Signed JWT token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret as any, {
    expiresIn: config.jwt.accessTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithm: "HS256"
  } as any);
};

/**
 * Generate Refresh Token (long-lived)
 * @param payload - Token payload with user info
 * @returns string - Signed JWT token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret as any, {
    expiresIn: config.jwt.refreshTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    algorithm: "HS256"
  } as any);
};

/**
 * Generate Tracking Token for request tracking (90 days)
 * @param email - User email
 * @param requestId - Request ID
 * @returns string - Signed JWT token
 */
export const generateTrackingToken = (
  email: string,
  requestId: number
): string => {
  return jwt.sign(
    { email, request_id: requestId },
    config.jwt.secret as any,
    {
      expiresIn: "90d",
      issuer: config.jwt.issuer,
      algorithm: "HS256"
    } as any
  );
};

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns JwtPayload | null - Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as any, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithms: config.passport.algorithms as any
    }) as unknown as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
};

/**
 * Verify tracking token
 * @param token - JWT token string
 * @returns TrackingTokenPayload | null - Decoded payload or null if invalid
 */
export const verifyTrackingToken = (
  token: string
): TrackingTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as any, {
      algorithms: config.passport.algorithms as any
    }) as unknown as TrackingTokenPayload;
    return decoded;
  } catch (error) {
    console.error("Tracking token verification failed:", error instanceof Error ? error.message : error);
    return null;
  }
};

// ===== USER REGISTRATION & LOGIN =====

/**
 * Validate email format
 * @param email - Email address
 * @returns boolean - True if valid email format
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param password - Password string
 * @returns object - { isValid: boolean, message: string }
 */
const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < config.auth.passwordMinLength) {
    return {
      isValid: false,
      message: `Password must be at least ${config.auth.passwordMinLength} characters long`
    };
  }
  return { isValid: true, message: "" };
};

/**
 * Register user with email and password
 * @param email - User email
 * @param password - User password
 * @param name - User full name
 * @returns Promise<AuthResponse> - Authentication response with tokens
 */
export const registerWithPassword = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  // Validate inputs
  if (!email || !password || !name) {
    throw new Error("Email, password, and name are required");
  }

  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.message);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: "USER"
    }
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const userProfile: UserProfile = {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return {
    accessToken,
    refreshToken,
    user: userProfile
  };
};

/**
 * Login user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise<AuthResponse> - Authentication response with tokens
 */
export const loginWithPassword = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Validate inputs
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.password) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const userProfile: UserProfile = {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return {
    accessToken,
    refreshToken,
    user: userProfile
  };
};

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token string
 * @returns Promise<AuthResponse> - New access token with user info
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; user: UserProfile }> => {
  const decoded = verifyToken(refreshToken);

  if (!decoded) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { user_id: decoded.user_id }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const tokenPayload: TokenPayload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(tokenPayload);

  const userProfile: UserProfile = {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  return {
    accessToken,
    user: userProfile
  };
};

// ===== USER MANAGEMENT =====

export const getUserById = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { user_id: userId }
  });
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email }
  });
};

export const getAllAssignees = async () => {
  return await prisma.user.findMany({
    where: { is_assignee: true },
    include: {
      scopes: true,
      ticket_assignments: {
        where: { is_active: true }
      }
    }
  });
};

export const toggleAssigneeRole = async (
  userId: number,
  isAssignee: boolean
) => {
  return await prisma.user.update({
    where: { user_id: userId },
    data: { is_assignee: isAssignee }
  });
};

export default {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTrackingToken,
  verifyToken,
  verifyTrackingToken,
  registerWithPassword,
  loginWithPassword,
  refreshAccessToken,
  getUserById,
  getUserByEmail,
  getAllAssignees,
  toggleAssigneeRole
};
