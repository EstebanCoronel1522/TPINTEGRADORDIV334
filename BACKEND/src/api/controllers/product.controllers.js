/*============================
    Controladores producto
============================*/

import ProductModel from "../models/product.model.js";

/////////////////////////////
// Obtener todos los productos (API)
export const getAllProducts = async (req, res) => {
    try {
        const [rows] = await ProductModel.selectAllProducts();

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No se encontraron productos"
            });
        }

        res.status(200).json({
            payload: rows,
            total: rows.length
        });
    } catch (error) {
        console.log("Error obteniendo productos: ", error);
        res.status(500).json({
            message: "Error interno al obtener productos"
        });
    }
};

/////////////////////////////
// Obtener productos activos (API para autoservicio cliente)
export const getActiveProducts = async (req, res) => {
    try {
        const [rows] = await ProductModel.selectActiveProducts();

        if (rows.length === 0) {
            return res.status(404).json({
                message: "No se encontraron productos activos"
            });
        }

        res.status(200).json({
            payload: rows,
            total: rows.length
        });
    } catch (error) {
        console.log("Error obteniendo productos activos: ", error);
        res.status(500).json({
            message: "Error interno al obtener productos activos"
        });
    }
};

/////////////////////////////
// Obtener producto por ID (API)
export const getProductById = async (req, res) => {
    try {
        const [rows] = await ProductModel.selectProductById(req.id);

        if (rows.length === 0) {
            return res.status(404).json({
                message: `No se encontro producto con id ${req.id}`
            });
        }

        res.status(200).json({
            payload: rows[0]
        });
    } catch (error) {
        console.log("Error obteniendo producto por ID: ", error);
        res.status(500).json({
            message: "Error interno al obtener producto"
        });
    }
};

/////////////////////////////
// Crear producto (API)
export const createProduct = async (req, res) => {
    try {
        const { name, image, category, price } = req.body;
        const [result] = await ProductModel.insertNewProduct(
            name.trim(),
            image.trim(),
            category,
            Number(price),
            1
        );

        res.status(201).json({
            message: "Producto creado exitosamente",
            productId: result.insertId
        });
    } catch (error) {
        console.log("Error creando producto: ", error);
        res.status(500).json({
            message: "Error interno al crear producto"
        });
    }
};

/////////////////////////////
// Modificar producto (API)
export const modifyProduct = async (req, res) => {
    try {
        const { id, name, image, price, category, active } = req.body;
        const numId = Number(id);

        if (!Number.isInteger(numId) || numId <= 0) {
            return res.status(400).json({
                message: "El ID del producto es invalido"
            });
        }

        const activeValue = active === false || active === 0 || active === "0" ? 0 : 1;

        const [result] = await ProductModel.updateProduct(
            name.trim(),
            image.trim(),
            Number(price),
            category,
            activeValue,
            numId
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "No se encontro producto para modificar"
            });
        }

        res.status(200).json({
            message: "Producto actualizado exitosamente"
        });
    } catch (error) {
        console.log("Error modificando producto: ", error);
        res.status(500).json({
            message: "Error interno al modificar producto"
        });
    }
};

/////////////////////////////
// Cambiar estado activo/inactivo (Baja logica o reactivacion)
export const toggleStatus = async (req, res) => {
    try {
        const { active } = req.body;
        const activeValue = active ? 1 : 0;

        const [result] = await ProductModel.updateProductStatus(req.id, activeValue);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: `Estado de producto actualizado a ${activeValue === 1 ? 'activo' : 'inactivo'}`
        });
    } catch (error) {
        console.log("Error cambiando estado de producto: ", error);
        res.status(500).json({
            message: "Error interno al actualizar estado del producto"
        });
    }
};

/////////////////////////////
// Eliminar producto fisicamente (API)
export const removeProduct = async (req, res) => {
    try {
        const [result] = await ProductModel.deleteProduct(req.id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Producto no encontrado"
            });
        }

        res.status(200).json({
            message: `Producto con id ${req.id} eliminado exitosamente`
        });
    } catch (error) {
        console.log("Error eliminando producto: ", error);
        res.status(500).json({
            message: "Error interno al eliminar producto"
        });
    }
};
