/*===========================
    Rutas de autenticacion
===========================*/

import { Router } from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/user.model.js";

const router = Router();

// GET /login - Mostrar pantalla de login
router.get("/login", (req, res) => {
    // Si ya existe sesion iniciada, redirigir directamente al dashboard
    if (req.session && req.session.user) {
        return res.redirect("/dashboard/principal");
    }

    res.render("login", {
        title: "Login de Administrador",
        about: "Autoservicio - Panel de Administración"
    });
});

// POST /login - Procesar credenciales con Bcrypt
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validamos que se hayan enviado ambos campos
        if (!email || !password) {
            return res.render("login", {
                title: "Login de Administrador",
                about: "Autoservicio - Panel de Administración",
                error: "Todos los campos son obligatorios"
            });
        }

        // Buscamos el usuario por su email
        const [rows] = await UserModel.findUserByEmail(email.trim().toLowerCase());

        if (rows.length === 0) {
            return res.render("login", {
                title: "Login de Administrador",
                about: "Autoservicio - Panel de Administración",
                error: "Credenciales incorrectas"
            });
        }

        const user = rows[0];

        // Comparamos la contraseña en texto plano con el hash guardado en la BBDD
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.render("login", {
                title: "Login de Administrador",
                about: "Autoservicio - Panel de Administración",
                error: "Credenciales incorrectas"
            });
        }

        // Si la clave es valida, creamos la sesion
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        // Redirigimos al panel de administracion
        res.redirect("/dashboard/principal");
    } catch (error) {
        console.log("Error en el login: ", error);
        res.status(500).render("login", {
            title: "Login de Administrador",
            about: "Autoservicio - Panel de Administración",
            error: "Error interno del servidor al procesar el login"
        });
    }
});

// POST /logout - Cerrar sesion
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error al destruir la sesion: ", err);
            return res.status(500).json({
                message: "Error al cerrar la sesion"
            });
        }

        // Redirigimos a la pantalla de login
        res.redirect("/login");
    });
});

export default router;
