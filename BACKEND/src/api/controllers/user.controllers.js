/*============================
    Controladores usuario
============================*/

import bcrypt from "bcrypt";
import UserModel from "../models/user.model.js";

// Crear nuevo usuario administrador con contraseña encriptada (bcrypt)
export const createNewUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Ciframos la contraseña con bcrypt (10 salt rounds)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await UserModel.insertNewUser(
            name.trim(),
            email.trim().toLowerCase(),
            hashedPassword,
            1
        );

        // Si la peticion fue enviada por un <form> nativo EJS
        if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
            return res.render("createUser", {
                title: "Crear Usuario",
                about: "Crear usuario admin",
                message: "Usuario admin creado exitosamente"
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
                    about: "Crear usuario admin",
                    error: "El correo electronico ya esta registrado"
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
