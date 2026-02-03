import express from "express";
import * as controller from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

// Registration & Password Login
router.post("/register", controller.register);
router.post("/login/password", controller.loginWithPassword);

// EP01-ST004: Google OAuth
router.get("/google", controller.getGoogleAuthUrl);
router.get("/google/callback", controller.handleGoogleCallback);

// Email login (legacy - creates user if doesn't exist)
router.post("/login", controller.emailLogin);

// Get current user
router.get("/me", authenticateToken, controller.getCurrentUser);

export default router;
