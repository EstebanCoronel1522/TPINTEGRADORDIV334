/*============================
    Controladores usuario
============================*/

import bcrypt from "bcrypt";
import UserModel from "../models/user.model.js";
import { getSafeCustomerRedirect } from "../utils/auth.js";

const insertNormalUser = async (name, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return UserModel.insertNewUser(name, email, hashedPassword, 0);
};

// Crear nuevo usuario normal con contraseña encriptada (bcrypt)
export const createNewUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const [result] = await insertNormalUser(
            name.trim(),
            email.trim().toLowerCase(),
            password
        );

        // Si la peticion fue enviada por un <form> nativo EJS
        if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
            return res.render("createUser", {
                title: "Crear Usuario",
                about: "Alta de nuevo usuario",
                message: "Usuario creado exitosamente",
                user: req.session.user
            });
        }

        // Si la peticion fue JSON (API)
        res.status(201).json({
            message: "Usuario creado exitosamente",
            userId: result.insertId
        });
    } catch (error) {
        console.log("Error creando usuario: ", error);

        if (error.code === "ER_DUP_ENTRY") {
            if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
                return res.render("createUser", {
                    title: "Crear Usuario",
                    about: "Alta de nuevo usuario",
                    error: "El correo electronico ya esta registrado",
                    user: req.session.user
                });
            }

            return res.status(400).json({
                message: "El correo electronico ya esta registrado"
            });
        }

        res.status(500).json({
            message: "Error interno al crear usuario"
        });
    }
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const next = getSafeCustomerRedirect(req.body.next);
    const errors = [];

    if (cleanName.length < 2) {
        errors.push("El nombre debe contener al menos 2 caracteres");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        errors.push("Ingresa un correo electrónico válido");
    }

    if (typeof password !== "string" || password.length < 4) {
        errors.push("La contraseña debe tener al menos 4 caracteres");
    }

    if (errors.length > 0) {
        return res.status(400).render("register", {
            title: "Registro de usuario",
            about: "Crear cuenta de usuario",
            error: errors.join(". "),
            next
        });
    }

    try {
        await insertNormalUser(cleanName, cleanEmail, password);
        res.redirect(`/login?registered=1&next=${encodeURIComponent(next)}`);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).render("register", {
                title: "Registro de usuario",
                about: "Crear cuenta de usuario",
                error: "Ese correo electrónico ya está registrado",
                next
            });
        }

        console.log("Error registrando usuario:", error);
        res.status(500).render("register", {
            title: "Registro de usuario",
            about: "Crear cuenta de usuario",
            error: "No se pudo crear la cuenta. Inténtalo nuevamente.",
            next
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const [rows] = await UserModel.selectAllUsers();
        res.status(200).json({ payload: rows });
    } catch (error) {
        console.log("Error obteniendo usuarios:", error);
        res.status(500).json({ message: "Error interno al obtener usuarios" });
    }
};

export const updateUserRole = async (req, res) => {
    const rawRole = req.body?.is_admin;
    const isAdmin = rawRole === true || rawRole === 1 || rawRole === "1" ? 1
        : rawRole === false || rawRole === 0 || rawRole === "0" ? 0
            : null;

    if (isAdmin === null) {
        return res.status(400).json({ message: "El rol indicado no es válido" });
    }

    try {
        const [users] = await UserModel.findUserById(req.id);
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const currentRole = Number(users[0].is_admin);
        if (currentRole === isAdmin) {
            return res.status(200).json({ message: "El usuario ya tiene ese rol" });
        }

        if (isAdmin === 0 && Number(req.session.user.id) === req.id) {
            return res.status(400).json({ message: "No puedes quitarte tu propio rol de administrador" });
        }

        if (isAdmin === 0) {
            const [[{ total }]] = await UserModel.countAdmins();
            if (Number(total) <= 1) {
                return res.status(409).json({ message: "No se puede quitar el rol al último administrador" });
            }
        }

        await UserModel.updateUserRole(req.id, isAdmin);
        res.status(200).json({
            message: `Usuario actualizado a ${isAdmin ? "administrador" : "normal"}`
        });
    } catch (error) {
        console.log("Error actualizando el rol del usuario:", error);
        res.status(500).json({ message: "Error interno al actualizar el rol" });
    }
};
