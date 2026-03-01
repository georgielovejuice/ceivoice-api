/**
 * Environment Configuration
 * Centralized configuration for the application
 */

export const config = {
  // Supabase Configuration (OAuth server)
supabase: {
  url: process.env.SUPABASE_URL || "",
  anonKey: process.env.SUPABASE_ANON_KEY || "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  jwtSecret: process.env.SUPABASE_JWT_SECRET || "",  // ✅ add this
  callbackURL:
    process.env.SUPABASE_OAUTH_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback",
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
    passwordMinLength: 8,
    devMode: process.env.AUTH_MODE === "DEV"
  },

  // Email Configuration (Resend)
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "noreply@mail.ceivoice.app",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
  },

  // RabbitMQ Configuration
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    enabled: process.env.RABBITMQ_ENABLED === "true" || process.env.NODE_ENV === "production"
  }
};

export default config;
