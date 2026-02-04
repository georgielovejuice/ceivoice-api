import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface AuthResponse {
  token: string;
  user: {
    user_id: number;
    email: string;
    name: string | null;
    role: string;
  };
}

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

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return { token, user: { user_id: user.user_id, email: user.email, name: user.name, role: user.role } };
  }

  // ===============================
  // PRODUCTION MODE (Google OAuth)
  // ===============================

  // 1. Verify Google ID token
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.name) {
    throw new Error("Invalid Google token payload");
  }

  const { email, name } = payload;

  // 2. Find or create user
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name as string,
        role: "USER"
      }
    });
  }

  // 3. Issue JWT (backend auth token)
  const backendToken = jwt.sign(
    {
      user_id: user.user_id,
      role: user.role
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return { token: backendToken, user: { user_id: user.user_id, email: user.email, name: user.name, role: user.role } };
};
