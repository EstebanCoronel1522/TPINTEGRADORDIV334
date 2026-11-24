/*===========================
    Rutas de autenticacion
===========================*/

import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import { registerUser } from "../controllers/user.controllers.js";
import environments from "../config/environments.js";
import { authenticateToken } from "../middlewares/middlewares.js";
import { getSafeCustomerRedirect } from "../utils/auth.js";

const router = Router();
const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 2
};

// GET /login - Mostrar pantalla de login
router.get("/login", (req, res) => {
    // Si ya existe una sesión, dirigirla a la sección correspondiente al rol.
    if (req.session && req.session.user) {
        return res.redirect(
            Number(req.session.user.is_admin) === 1 ? "/dashboard/principal" : "/index.html"
        );
    }

    res.render("login", {
        title: "Iniciar Sesión",
        about: "Autoservicio",
        message: req.query.registered === "1" ? "Cuenta creada. Ya puedes iniciar sesión." : undefined,
        next: getSafeCustomerRedirect(req.query.next),
        registerUrl: `/register?next=${encodeURIComponent(getSafeCustomerRedirect(req.query.next))}`
    });
});

router.get("/register", (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect(
            Number(req.session.user.is_admin) === 1 ? "/dashboard/principal" : "/index.html"
        );
    }

    res.render("register", {
        title: "Registro de usuario",
        about: "Crear cuenta de usuario",
        next: getSafeCustomerRedirect(req.query.next)
    });
});

router.post("/register", registerUser);

router.get("/api/auth/me", (req, res) => {
    res.set("Cache-Control", "no-store");
    authenticateToken(req, res, () => {
        if (!req.authUser) {
            return res.status(200).json({ payload: null });
        }

        const { id, name, email, is_admin } = req.authUser;
        res.status(200).json({
            payload: { id, name, email, is_admin: Number(is_admin) }
        });
    }, true);
});

// POST /login - Procesar credenciales con Bcrypt
router.post("/login", async (req, res) => {
    const renderLoginError = (res, error, status = 200) => res.status(status).render("login", {
        title: "Iniciar Sesión",
        about: "Autoservicio",
        error,
        next: getSafeCustomerRedirect(req.body.next),
        registerUrl: `/register?next=${encodeURIComponent(getSafeCustomerRedirect(req.body.next))}`
    });

    try {
        const { email, password } = req.body;

        // Validamos que se hayan enviado ambos campos
        if (!email || !password) {
            return renderLoginError(res, "Todos los campos son obligatorios");
        }

        // Buscamos el usuario por su email
        const [rows] = await UserModel.findUserByEmail(email.trim().toLowerCase());

        if (rows.length === 0) {
            return renderLoginError(res, "Credenciales incorrectas");
        }

        const user = rows[0];

        // Comparamos la contraseña en texto plano con el hash guardado en la BBDD
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return renderLoginError(res, "Credenciales incorrectas");
        }

        const isAdmin = Number(user.is_admin) === 1;
        if (isAdmin) {
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                is_admin: 1
            };
        } else {
            delete req.session.user;
        }

        const token = jwt.sign(
            { sub: String(user.id) },
            environments.jwt_secret,
            { expiresIn: "2h" }
        );
        res.cookie("auth_token", token, authCookieOptions);
        res.redirect(isAdmin ? "/dashboard/principal" : getSafeCustomerRedirect(req.body.next));
    } catch (error) {
        console.log("Error en el login: ", error);
        renderLoginError(res, "Error interno del servidor al procesar el login", 500);
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

        res.clearCookie("auth_token", {
            httpOnly: authCookieOptions.httpOnly,
            secure: authCookieOptions.secure,
            sameSite: authCookieOptions.sameSite,
            path: authCookieOptions.path
        });
        res.redirect("/index.html");
    });
});

export default router;
