const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");

router.post("/:id/status", ticketController.updateStatus);
router.patch("/:id/status", ticketController.updateStatus);

module.exports = router;
