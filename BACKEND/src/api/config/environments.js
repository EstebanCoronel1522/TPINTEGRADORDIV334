// Importamos el modulo dotenv para poder cargar las variables de entorno del .env
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno desde el archivo .env

export default {
    port: process.env.PORT || 3001,
    database: {
        host: process.env.DB_HOST || "localhost",
        name: process.env.DB_NAME || "tp_autoservicio",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || ""
    },
    session_key: process.env.SESSION_KEY || "clave_secreta_autoservicio",
    jwt_secret: process.env.JWT_SECRET || process.env.SESSION_KEY || "clave_secreta_autoservicio"
};
