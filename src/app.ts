import express, { Express } from "express";
import cors from "cors";

import ticketRoutes from "./routes/ticket.route";
import adminTicketRoutes from "./routes/adminticket.route";
import requestRoutes from "./routes/request.route";
import workflowRoutes from "./routes/workflow.route";
import reportingRoutes from "./routes/reporting.route";

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

// ===== ROUTES =====
app.use("/api/requests", requestRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminTicketRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/reporting", reportingRoutes);

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
    authentication: "Supabase OAuth + JWT",
    endpoints: {
      tickets: "/api/tickets",
      requests: "/api/requests",
      admin: "/api/admin",
      workflow: "/api/workflow",
      reporting: "/api/reporting",
      health: "/health"
    }
  });
});

// ===== 404 HANDLER =====
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

export default app;
