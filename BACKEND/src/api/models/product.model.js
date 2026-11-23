/*============================
    Modelos de producto
============================*/

import connection from "../database/database.js";

/////////////////////////////
// Obtener todos los productos
export const selectAllProducts = () => {
    return connection.query("SELECT * FROM products");
};

/////////////////////////////
// Obtener productos activos (para el cliente)
export const selectActiveProducts = () => {
    const sql = "SELECT * FROM products WHERE active = 1";
    return connection.query(sql);
};

/////////////////////////////
// Obtener producto por id
export const selectProductById = (id) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    return connection.query(sql, [id]);
};

/////////////////////////////
// Crear nuevo producto (activo por defecto)
export const insertNewProduct = (name, image, category, price, active = 1) => {
    const sql = "INSERT INTO products (name, image, category, price, active) VALUES (?, ?, ?, ?, ?)";
    return connection.query(sql, [name, image, category, price, active]);
};

/////////////////////////////
// Modificar producto
export const updateProduct = (name, image, price, category, active, id) => {
    const sql = "UPDATE products SET name = ?, image = ?, price = ?, category = ?, active = ? WHERE id = ?";
    return connection.query(sql, [name, image, price, category, active, id]);
};

/////////////////////////////
// Modificar estado de producto (baja logica / reactivacion)
export const updateProductStatus = (id, active) => {
    const sql = "UPDATE products SET active = ? WHERE id = ?";
    return connection.query(sql, [active, id]);
};

/////////////////////////////
// Eliminar producto fisicamente
export const deleteProduct = (id) => {
    const sql = "DELETE FROM products WHERE id = ?";
    return connection.query(sql, [id]);
};

export default {
    selectAllProducts,
    selectActiveProducts,
    selectProductById,
    insertNewProduct,
    updateProduct,
    updateProductStatus,
    deleteProduct
};
