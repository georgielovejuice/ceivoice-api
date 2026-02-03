const express = require("express");
const router = express.Router();
const controller = require("../controllers/request");

router.post("/", controller.submitRequest);

module.exports = router;
