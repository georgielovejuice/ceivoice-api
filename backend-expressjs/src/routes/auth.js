const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { authenticate } = require("../middlewares/auth.middleware");

router.post("/google", authController.googleLogin);
router.get("/me", authenticate, authController.me);

module.exports = router;
