/*============================
    Controladores vistas (EJS)
============================*/

import ProductModel from "../models/product.model.js";

// Vista principal (Dashboard con listado de productos)
export const vistaPrincipal = async (req, res) => {
    try {
        const [rows] = await ProductModel.selectAllProducts();

        res.render("index", {
            title: "Dashboard - Principal",
            listaProductos: rows,
            user: req.session.user
        });
    } catch (error) {
        console.log("Error obteniendo productos para el dashboard: ", error);
        res.status(500).render("index", {
            title: "Dashboard - Principal",
            listaProductos: [],
            error: "Error al cargar los productos de la base de datos"
        });
    }
};

// Vista consultar producto por ID
export const vistaConsultar = (req, res) => {
    res.render("get", {
        title: "Consultar Producto",
        about: "Consultar producto por ID"
    });
};

// Vista crear producto
export const vistaCrear = (req, res) => {
    res.render("post", {
        title: "Crear Producto",
        about: "Alta de nuevo producto"
    });
};

// Vista crear usuario administrador
export const vistaCrearUser = (req, res) => {
    res.render("createUser", {
        title: "Crear Usuario",
        about: "Alta de nuevo usuario administrador"
    });
};

// Vista modificar producto
export const vistaModificar = (req, res) => {
    res.render("put", {
        title: "Modificar Producto",
        about: "Modificación de producto existente"
    });
};

// Vista eliminar producto / baja logica
export const vistaEliminar = (req, res) => {
    res.render("delete", {
        title: "Eliminar Producto",
        about: "Baja física o lógica de producto"
    });
};
