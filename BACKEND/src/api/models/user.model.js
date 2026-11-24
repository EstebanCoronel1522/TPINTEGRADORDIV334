/*============================
    Modelos de usuario
============================*/

import connection from "../database/database.js";

// Crear nuevo usuario (con password hasheado)
export const insertNewUser = (name, email, password, is_admin = 1) => {
    const sql = "INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)";
    return connection.query(sql, [name, email, password, is_admin]);
};

// Buscar usuario por email (para autenticacion)
export const findUserByEmail = (email) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    return connection.query(sql, [email]);
};

// Buscar usuario por id
export const findUserById = (id) => {
    const sql = "SELECT id, name, email, is_admin FROM users WHERE id = ?";
    return connection.query(sql, [id]);
};

export const selectAllUsers = () => {
    return connection.query("SELECT id, name, email, is_admin FROM users ORDER BY id");
};

export const updateUserRole = (id, isAdmin) => {
    return connection.query("UPDATE users SET is_admin = ? WHERE id = ?", [isAdmin, id]);
};

export const countAdmins = () => {
    return connection.query("SELECT COUNT(*) AS total FROM users WHERE is_admin = 1");
};

export default {
    insertNewUser,
    findUserByEmail,
    findUserById,
    selectAllUsers,
    updateUserRole,
    countAdmins
};
