/*==================
    Importaciones
==================*/
import express from "express";
import cors from "cors";
import session from "express-session";
import { existsSync } from "fs";
import environments from "./src/api/config/environments.js";
import { loggerUrl } from "./src/api/middlewares/middlewares.js";
import { authRouters, productRouters, salesRouters, userRouters, viewRouters } from "./src/api/routers/index.js";
import { __dirname, join } from "./src/api/utils/index.js";

/*==================
    Configuración
==================*/
const app = express();
const { port, session_key } = environments;
const PORT = port;

// Configuración de rutas para vistas EJS y estáticos (compatibilidad con FRONTEND en branch features/frontend)
const viewsPath = existsSync(join(__dirname, "../FRONTEND/views"))
    ? join(__dirname, "../FRONTEND/views")
    : join(__dirname, "views");

const publicPath = existsSync(join(__dirname, "../FRONTEND/public"))
    ? join(__dirname, "../FRONTEND/public")
    : join(__dirname, "public");
const uploadsPath = join(__dirname, "uploads");

app.set("view engine", "ejs");
app.set("views", viewsPath);

/*==================
    Middlewares
==================*/
// Middleware para servir archivos estáticos
app.use("/uploads", express.static(uploadsPath, { dotfiles: "deny", index: false }));
app.use(express.static(publicPath));

// Habilitar CORS para peticiones desde el frontend
app.use(cors());

// Parseo de solicitudes JSON (API REST)
app.use(express.json());

// Parseo de formularios HTML nativos (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Middleware logger para registrar en consola método y ruta
app.use(loggerUrl);

// Middleware de sesión para autenticación
app.use(session({
    secret: session_key,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // En producción con HTTPS será true
        maxAge: 1000 * 60 * 60 * 2 // 2 horas de sesión
    }
}));

/*==================
    Rutas
==================*/
// Redirección inicial
app.get("/", (req, res) => {
    res.redirect("/index.html");
});

// Rutas de autenticación (GET /login, POST /login, POST /logout)
app.use("/", authRouters);

// Rutas de vistas del Backoffice EJS (/dashboard/principal, /dashboard/crear, etc.)
app.use("/dashboard", viewRouters);

// Endpoints de la API REST de productos (/api/products)
app.use("/api/products", productRouters);

// Endpoints de la API REST de usuarios (/api/users)
app.use("/api/users", userRouters);

// Endpoint para registrar compras autenticadas
app.use("/api/sales", salesRouters);

/*==================
    Inicio del Servidor
==================*/
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`Servidor Backend Autoservicio: http://localhost:${PORT}`);
    console.log(`Endpoints API Productos:      http://localhost:${PORT}/api/products`);
    console.log(`Endpoints API Usuarios:       http://localhost:${PORT}/api/users`);
    console.log(`Login Backoffice:             http://localhost:${PORT}/login`);
    console.log(`===============================================`);
});
