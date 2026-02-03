const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket");
const { authenticate } = require("../middlewares/auth.middleware");

router.post("/:id/status", authenticate, ticketController.updateStatus);
router.patch("/:id/status", authenticate, ticketController.updateStatus);

module.exports = router;
