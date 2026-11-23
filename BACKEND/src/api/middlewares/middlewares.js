/*======================
    Middlewares
======================*/

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

    if (!name || !image || price === undefined || !category) {
        errores.push("Faltan campos requeridos (name, image, price, category)");
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

// Middleware para proteger rutas del dashboard administrativo
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect("/login");
    }
    next();
};

export {
    loggerUrl,
    validateId,
    validateProduct,
    validateUser,
    requireLogin
};
