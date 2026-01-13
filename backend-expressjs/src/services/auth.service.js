const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (idToken) => {
  // DEV MODE (no Google call)
  if (process.env.AUTH_MODE === "DEV") {
    const role = process.env.DEV_ROLE || "ADMIN";

    const fakeEmail =
      role === "ADMIN" ? "admin@test.com" : "user@test.com";

    const fakeName =
      role === "ADMIN" ? "Dev Admin" : "Dev User";

    let user = await prisma.user.findUnique({
      where: { email: fakeEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: fakeEmail,
          name: fakeName,
          role,
        },
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token, user };
  }

  // ===============================
  // PRODUCTION MODE (Google OAuth)
  // ===============================

  // 1. Verify Google ID token
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name } = payload;

  // 2. Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        role: "USER", // default role
      },
    });
  }

  // 3. Issue JWT (backend auth token)
  const token = jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user };
};
