const urlBase = window.location.origin || "http://localhost:3000";
const contenedorProductos = document.getElementById("contenedor-productos");
const createProductForm = document.getElementById("createProductForm");

function validarFormulario(data, hasImageFile) {
    const errores = [];

    if (!data.name || !data.price || (!data.image && !hasImageFile) || !data.category) {
        errores.push("Faltan campos requeridos");
    }

    if (data.image && hasImageFile) {
        errores.push("Indica una URL o adjunta un archivo, no ambos.");
    }

    if (data.name && data.name.trim().length < 2) {
        errores.push("El nombre debe tener al menos 2 caracteres");
    }

    if (isNaN(data.price) || data.price <= 0) {
        errores.push("El precio debe ser un numero mayor a 0");
    }

    if (!["perifericos", "componentes"].includes(data.category)) {
        errores.push("Categoria invalida. Elija 'perifericos' o 'componentes'");
    }

    return errores;
}

function mostrarMensaje(tipo, mensaje) {
    contenedorProductos.innerHTML = `<p class="mensaje ${tipo}">${mensaje}</p>`;
}

function mostrarListaErrores(array) {
    let htmlErrores = "";
    array.forEach(error => {
        htmlErrores += `<p class="mensaje error">${error}</p>`;
    });
    contenedorProductos.innerHTML = htmlErrores;
}

createProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const formObj = Object.fromEntries(formData.entries());
    const imageFile = formData.get("imageFile");
    const hasImageFile = imageFile instanceof File && imageFile.size > 0;

    formObj.price = Number(formObj.price);
    formObj.name = formObj.name.trim();
    formObj.image = formObj.image.trim();

    const errores = validarFormulario(formObj, hasImageFile);
    if (errores.length > 0) {
        return mostrarListaErrores(errores);
    }

    try {
        const response = await fetch(`${urlBase}/api/products`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.listaErrores) {
                return mostrarListaErrores(data.listaErrores);
            }
            return mostrarMensaje("error", data.message || "Error al crear el producto");
        }

        createProductForm.reset();
        mostrarMensaje("exito", `${data.message} con ID: ${data.productId}`);
    } catch (error) {
        console.error("Error al crear producto: ", error);
        mostrarMensaje("error", "Error de conexion con el servidor");
    }
});
