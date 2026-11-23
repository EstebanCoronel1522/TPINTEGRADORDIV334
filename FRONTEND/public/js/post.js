const urlBase = window.location.origin || "http://localhost:3000";
const contenedorProductos = document.getElementById("contenedor-productos");
const createProductForm = document.getElementById("createProductForm");

function validarFormulario(data) {
    const errores = [];

    if (!data.name || !data.price || !data.image || !data.category) {
        errores.push("Faltan campos requeridos");
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

    formObj.price = Number(formObj.price);
    formObj.name = formObj.name.trim();
    formObj.image = formObj.image.trim();

    const errores = validarFormulario(formObj);
    if (errores.length > 0) {
        return mostrarListaErrores(errores);
    }

    try {
        const response = await fetch(`${urlBase}/api/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formObj)
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
