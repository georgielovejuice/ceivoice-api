import express from "express";
import * as requestController from "../controllers/request.controller";

const router = express.Router();

router.post("/", requestController.submitRequest);

export default router;
