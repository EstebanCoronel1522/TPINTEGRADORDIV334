/*======================
    Rutas de producto (API)
======================*/

import { Router } from "express";
import { requireAdmin, validateId, validateProduct } from "../middlewares/middlewares.js";
import { parseProductImage, storeProductImage } from "../middlewares/product-image-upload.js";
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
router.post("/", requireAdmin, parseProductImage, validateProduct, storeProductImage, createProduct);

// PUT modificar producto
router.put("/", requireAdmin, validateProduct, modifyProduct);

// PATCH cambiar el estado activo/inactivo
router.patch("/:id/status", requireAdmin, validateId, toggleStatus);

// DELETE eliminar producto fisicamente
router.delete("/:id", requireAdmin, validateId, removeProduct);

export default router;
