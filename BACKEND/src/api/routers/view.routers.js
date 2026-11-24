/*======================
    Rutas de vistas EJS
======================*/

import { Router } from "express";
import {
    vistaPrincipal,
    vistaConsultar,
    vistaCrear,
    vistaCrearUser,
    vistaModificar,
    vistaEliminar
} from "../controllers/view.controllers.js";
import { requireAdmin } from "../middlewares/middlewares.js";

const router = Router();

// Todas las rutas del dashboard administrativo requieren sesion iniciada
router.get("/", requireAdmin, (req, res) => res.redirect("/dashboard/principal"));
router.get("/principal", requireAdmin, vistaPrincipal);
router.get("/consultar", requireAdmin, vistaConsultar);
router.get("/crear", requireAdmin, vistaCrear);
router.get("/crearUser", requireAdmin, vistaCrearUser);
router.get("/modificar", requireAdmin, vistaModificar);
router.get("/eliminar", requireAdmin, vistaEliminar);

export default router;
