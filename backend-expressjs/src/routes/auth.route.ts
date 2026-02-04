import express from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/google", authController.googleLogin);
router.get("/me", authenticate, authController.me);

export default router;
