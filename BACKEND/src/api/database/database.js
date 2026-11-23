// Importamos el modulo mysql2 en modo promesas, para poder hacer peticiones asincronas a la BBDD
import mysql2 from "mysql2/promise";

// Importamos la informacion de la conexion a la BBDD
import environments from "../config/environments.js";

// Extraemos con destructuring la info de la conexion a la BBDD
const { database } = environments;

// Creamos el pool de conexiones a la BBDD
const connection = mysql2.createPool({
    host: database.host,
    database: database.name,
    user: database.user,
    password: database.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportamos el pool de conexiones para poder ser usado en los modelos
export default connection;
