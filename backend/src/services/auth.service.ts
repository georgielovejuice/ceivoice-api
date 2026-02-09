import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===== INTERFACES =====

export interface AuthResponse {
  token: string;
  user: {
    user_id: number;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role: string;
}

// ===== PASSWORD HASHING =====

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// ===== JWT TOKEN GENERATION =====

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "7d"
  });
};

export const generateTrackingToken = (
  email: string,
  requestId: number
): string => {
  return jwt.sign(
    { email, request_id: requestId },
    process.env.JWT_SECRET as string,
    { expiresIn: "90d" }
  );
};

export const verifyToken = (
  token: string
): TokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};

export const verifyTrackingToken = (
  token: string
): { email: string; request_id: number } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { email: string; request_id: number };
    return decoded;
  } catch (error) {
    console.error("Error verifying tracking token:", error);
    return null;
  }
};

// ===== GOOGLE OAUTH LOGIN =====

export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  // DEV MODE (no Google call)
  if (process.env.AUTH_MODE === "DEV") {
    const role = process.env.DEV_ROLE || "ADMIN";
    const fakeEmail = role === "ADMIN" ? "admin@test.com" : "user@test.com";
    const fakeName = role === "ADMIN" ? "Dev Admin" : "Dev User";

    let user = await prisma.user.findUnique({
      where: { email: fakeEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: fakeEmail,
          name: fakeName,
          role
        }
      });
    }

    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  // ===============================
  // PRODUCTION MODE (Google OAuth)
  // ===============================

  // 1. Verify Google ID token
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.name) {
    throw new Error("Invalid Google token payload");
  }

  const { email, name, sub: googleId } = payload;

  // 2. Find or create user
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name as string,
        role: "USER",
        google_id: googleId
      }
    });
  }

  // 3. Issue JWT (backend auth token)
  const backendToken = generateToken({
    user_id: user.user_id,
    email: user.email,
    role: user.role
  });

  return {
    token: backendToken,
    user: {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
};

// ===== EMAIL/PASSWORD REGISTRATION =====

export const registerWithPassword = async (
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> => {
  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    throw new Error("User with this email already exists");
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "USER"
    }
  });

  const token = generateToken({
    user_id: user.user_id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
};

// ===== EMAIL/PASSWORD LOGIN =====

export const loginWithPassword = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
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

  // Generate token
  const token = generateToken({
    user_id: user.user_id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    }
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
