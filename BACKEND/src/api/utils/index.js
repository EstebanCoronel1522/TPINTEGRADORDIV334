// Logica para trabajar con rutas y archivos del proyecto en ESM
import { join } from "path";

// Construimos __dirname apuntando a la raiz de BACKEND
const __dirname = join(import.meta.dirname, "../../../");

export {
    __dirname,
    join
};
