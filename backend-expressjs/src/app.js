const express = require("express");
const cors = require("cors");
const app = express();

const requestRoutes = require("./routes/request.routes");
const ticketRoutes = require("./routes/ticket.routes");
const adminTicketRoutes = require("./routes/admin.ticket.routes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use("/api/requests", requestRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminTicketRoutes);
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/requests", require("./routes/request.routes"));

module.exports = app;