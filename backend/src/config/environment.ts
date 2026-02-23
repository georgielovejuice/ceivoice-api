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

  // JWT algorithm list (used when verifying tokens)
  jwtAlgorithms: ["HS256"] as string[],

  // Supabase Configuration (OAuth server)
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    // The URL Supabase will redirect to after the Google OAuth dance.
    // Must be registered in your Supabase project → Auth → URL Configuration.
    callbackURL:
      process.env.SUPABASE_OAUTH_CALLBACK_URL ||
      "http://localhost:5000/api/auth/google/callback"
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
  },

  // Email Configuration (Resend)
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "noreply@ceivoice.com",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
  },

  // RabbitMQ Configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    enabled: process.env.RABBITMQ_ENABLED === "true" || process.env.NODE_ENV === "production"
  }
};

export default config;
