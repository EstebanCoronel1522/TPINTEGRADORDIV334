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
import { requireLogin } from "../middlewares/middlewares.js";

const router = Router();

// Todas las rutas del dashboard administrativo requieren sesion iniciada
router.get("/", requireLogin, (req, res) => res.redirect("/dashboard/principal"));
router.get("/principal", requireLogin, vistaPrincipal);
router.get("/consultar", requireLogin, vistaConsultar);
router.get("/crear", requireLogin, vistaCrear);
router.get("/crearUser", requireLogin, vistaCrearUser);
router.get("/modificar", requireLogin, vistaModificar);
router.get("/eliminar", requireLogin, vistaEliminar);

export default router;
