/*======================
    Rutas de usuario (API)
======================*/

import { Router } from "express";
import { requireAdmin, validateId, validateUser } from "../middlewares/middlewares.js";
import { createNewUser, getAllUsers, updateUserRole } from "../controllers/user.controllers.js";

const router = Router();

router.get("/", requireAdmin, getAllUsers);
router.post("/", requireAdmin, validateUser, createNewUser);
router.patch("/:id/role", requireAdmin, validateId, updateUserRole);

export default router;
