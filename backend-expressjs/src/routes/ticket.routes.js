const express = require("express");
const router = express.Router();
const controller = require("../controllers/ticket.controller");

router.post("/:id/status", controller.updateStatus);

module.exports = router;
