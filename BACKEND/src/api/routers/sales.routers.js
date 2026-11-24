import { Router } from "express";
import { createSale } from "../controllers/sale.controllers.js";
import { authenticateToken } from "../middlewares/middlewares.js";

const router = Router();

router.post("/", authenticateToken, createSale);

export default router;
