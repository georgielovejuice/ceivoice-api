/**
 * Environment Configuration
 * Centralized configuration for the application
 */

export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || "7d",
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || "30d",
    issuer: "ceivoice-api",
    audience: "ceivoice-clients"
  },

  // Passport Configuration
  passport: {
    jwtFromRequest: "authorization", // Authorization header with Bearer scheme
    algorithms: ["HS256"]
  },

  // Google OAuth Configuration
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_REDIRECT_URI_OAUTH || "http://localhost:5000/api/auth/google/callback"
  },

  // API Configuration
  api: {
    environment: process.env.NODE_ENV || "development",
    port: Number.parseInt(process.env.PORT || "5000", 10),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
  },

  // Auth Configuration
  auth: {
    bcryptRounds: 10,
    passwordMinLength: 6,
    devMode: process.env.AUTH_MODE === "DEV"
  }
};

export default config;
