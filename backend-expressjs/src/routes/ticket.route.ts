import express from "express";
import * as ticketController from "../controllers/ticket.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/:id/status", authenticate, ticketController.updateStatus);
router.patch("/:id/status", authenticate, ticketController.updateStatus);

export default router;
