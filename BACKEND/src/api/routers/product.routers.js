/*======================
    Rutas de producto (API)
======================*/

import { Router } from "express";
import { validateId, validateProduct } from "../middlewares/middlewares.js";
import {
    getAllProducts,
    getActiveProducts,
    getProductById,
    createProduct,
    modifyProduct,
    toggleStatus,
    removeProduct
} from "../controllers/product.controllers.js";

const router = Router();

// GET todos los productos
router.get("/", getAllProducts);

// GET solo productos activos (para autoservicio cliente)
router.get("/active", getActiveProducts);

// GET producto por id
router.get("/:id", validateId, getProductById);

// POST crear nuevo producto
router.post("/", validateProduct, createProduct);

// PUT modificar producto
router.put("/", validateProduct, modifyProduct);

// PATCH alternar estado activo/inactivo (baja logica / reactivacion)
router.patch("/:id/status", validateId, toggleStatus);

// DELETE eliminar producto fisicamente
router.delete("/:id", validateId, removeProduct);

export default router;
