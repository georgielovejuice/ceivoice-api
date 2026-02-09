import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/google-login", authController.googleLogin);
router.post("/register", authController.register);
router.post("/login", authController.loginWithPassword);

// Protected routes
router.get("/me", authenticate, authController.me);

export default router;
