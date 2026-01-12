const express = require("express");
const cors = require("cors");

const requestRoutes = require("./routes/request.routes");
const ticketRoutes = require("./routes/ticket.routes");
const adminTicketRoutes = require("./routes/admin.ticket.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/requests", requestRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminTicketRoutes);

module.exports = app;