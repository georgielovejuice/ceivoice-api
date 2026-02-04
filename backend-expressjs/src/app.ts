import express, { Express } from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import ticketRoutes from "./routes/ticket.route";
import adminTicketRoutes from "./routes/adminticket.route";
import requestRoutes from "./routes/request.route";

const app: Express = express();

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
  res.json({ status: "ok" });
});

export default app;
