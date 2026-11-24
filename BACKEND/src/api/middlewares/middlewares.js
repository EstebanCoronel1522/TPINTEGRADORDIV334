/*======================
    Middlewares
======================*/

import UserModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import environments from "../config/environments.js";

// Middleware logger para registrar en consola las solicitudes entrantes
const loggerUrl = (req, res, next) => {
    const fecha = new Date();
    console.log(`[${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}] ${req.method} ${req.url}`);
    next(); // Damos paso al siguiente middleware o ruta
};

// Middleware para filtrar y validar que el ID sea un entero positivo
const validateId = (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "El id debe ser un numero entero positivo"
        });
    }

    req.id = id;
    next();
};

// Middleware para validar datos al crear o modificar productos
const validateProduct = (req, res, next) => {
    const categoriasValidas = ["perifericos", "componentes"];
    const errores = [];

    const { name, image, price, category } = req.body;
    const hasImageUrl = typeof image === "string" && image.trim().length > 0;
    const hasImageFile = Boolean(req.file);

    if (!name || price === undefined || !category) {
        errores.push("Faltan campos requeridos (name, price, category)");
    }

    if (!hasImageUrl && !hasImageFile) {
        errores.push("Debes indicar una URL de imagen o adjuntar un archivo.");
    }

    if (hasImageUrl && hasImageFile) {
        errores.push("Indica una URL o adjunta un archivo, no ambos.");
    }

    if (image !== undefined && typeof image !== "string") {
        errores.push("La URL de imagen debe ser texto.");
    }

    if (typeof name !== "string" || name.trim().length < 2) {
        errores.push("El nombre debe tener al menos dos caracteres");
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
        errores.push("El precio debe ser un numero mayor a 0");
    }

    if (!categoriasValidas.includes(category)) {
        errores.push("Categoria invalida. Debe ser 'perifericos' o 'componentes'");
    }

    if (errores.length > 0) {
        return res.status(400).json({
            message: "Datos invalidos",
            listaErrores: errores
        });
    }

    next();
};

// Middleware para validar datos de creacion de usuario
const validateUser = (req, res, next) => {
    const { name, email, password } = req.body;
    const errores = [];

    if (!name || !email || !password) {
        errores.push("Todos los campos (name, email, password) son obligatorios");
    }

    if (name && name.trim().length < 2) {
        errores.push("El nombre debe contener al menos 2 caracteres");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        errores.push("El formato de correo electronico no es valido");
    }

    if (password && password.length < 4) {
        errores.push("La contraseña debe tener al menos 4 caracteres");
    }

    if (errores.length > 0) {
        return res.status(400).json({
            message: "Datos de usuario invalidos",
            listaErrores: errores
        });
    }

    next();
};

const requireAdmin = async (req, res, next) => {
    if (!req.session || !req.session.user) {
        if (req.originalUrl.startsWith("/api/")) {
            return res.status(401).json({ message: "Debes iniciar sesión como administrador" });
        }
        return res.redirect("/login");
    }

    try {
        const [rows] = await UserModel.findUserById(req.session.user.id);
        if (rows.length === 0 || Number(rows[0].is_admin) !== 1) {
            if (req.originalUrl.startsWith("/api/")) {
                return res.status(403).json({ message: "Se requieren permisos de administrador" });
            }
            return res.status(403).send("Se requieren permisos de administrador");
        }

        req.session.user.is_admin = 1;
        next();
    } catch (error) {
        console.log("Error verificando permisos de administrador:", error);
        if (req.originalUrl.startsWith("/api/")) {
            return res.status(500).json({ message: "No se pudieron verificar los permisos" });
        }
        return res.status(500).send("No se pudieron verificar los permisos");
    }
};

const authenticateToken = async (req, res, next, optional = false) => {
    const authorization = req.get("authorization");
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const cookieToken = req.headers.cookie
        ?.split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("auth_token="))
        ?.slice("auth_token=".length);
    const token = bearerToken || cookieToken;

    if (!token) {
        if (optional) {
            req.authUser = null;
            return next();
        }
        return res.status(401).json({ message: "Debes iniciar sesión para realizar esta acción" });
    }

    let claims;
    try {
        claims = jwt.verify(token, environments.jwt_secret);
    } catch (error) {
        const message = error.name === "TokenExpiredError"
            ? "La sesión expiró. Inicia sesión nuevamente."
            : "El token de autenticación no es válido";
        return res.status(401).json({ message });
    }

    const userId = Number(claims.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({ message: "El token de autenticación no es válido" });
    }

    try {
        const [rows] = await UserModel.findUserById(userId);
        if (rows.length === 0) {
            return res.status(401).json({ message: "La cuenta asociada al token ya no existe" });
        }

        req.authUser = rows[0];
        next();
    } catch (error) {
        console.log("Error verificando token de autenticación:", error);
        res.status(500).json({ message: "No se pudo verificar la autenticación" });
    }
};

export {
    loggerUrl,
    validateId,
    validateProduct,
    validateUser,
    requireAdmin,
    authenticateToken
};
