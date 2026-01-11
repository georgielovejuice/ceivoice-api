const express = require("express");
const router = express.Router();
const controller = require("../controllers/request.controller");

router.post("/", controller.submitRequest);

module.exports = router;
