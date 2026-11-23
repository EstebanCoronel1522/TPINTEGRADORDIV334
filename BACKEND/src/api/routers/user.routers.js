/*======================
    Rutas de usuario (API)
======================*/

import { Router } from "express";
import { validateUser } from "../middlewares/middlewares.js";
import { createNewUser } from "../controllers/user.controllers.js";

const router = Router();

// POST crear nuevo usuario admin (hasheando password con bcrypt)
router.post("/", validateUser, createNewUser);

export default router;
