import express, { Express } from "express";
import cors from "cors";
import passport from "passport";

// Import Passport configuration
import "./config/passport";

import authRoutes from "./routes/auth.route";
import ticketRoutes from "./routes/ticket.route";
import adminTicketRoutes from "./routes/adminticket.route";
import requestRoutes from "./routes/request.route";

const app: Express = express();

// ===== MIDDLEWARE =====

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== PASSPORT.JS INITIALIZATION =====
app.use(passport.initialize());
// Note: passport.session() not used since we're using stateless JWT auth

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminTicketRoutes);

// ===== HEALTH CHECK =====
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== ROOT ENDPOINT =====
app.get("/", (_req, res) => {
  res.json({
    name: "CeiVoice API Backend",
    version: "2.0.0",
    status: "running",
    authentication: "Passport.js with JWT",
    endpoints: {
      auth: "/api/auth",
      tickets: "/api/tickets",
      requests: "/api/requests",
      admin: "/api/admin",
      health: "/health"
    }
  });
});

// ===== 404 HANDLER =====
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

export default app;
