import express, { Express } from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import ticketRoutes from "./routes/ticket.route";
import adminTicketRoutes from "./routes/adminticket.route";
import requestRoutes from "./routes/request.route";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminTicketRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "CeiVoice API Backend",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      tickets: "/api/tickets",
      requests: "/api/requests",
      admin: "/api/admin",
      health: "/health"
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

export default app;
