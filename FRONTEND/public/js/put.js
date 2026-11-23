const urlBase = window.location.origin || "http://localhost:3000";
const contenedorProductos = document.getElementById("contenedor-productos");
const contenedorForm = document.getElementById("contenedor-form");
const getProductForm = document.getElementById("getProductForm");

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
        errores.push("Categoria invalida");
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

getProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    contenedorForm.innerHTML = "";

    const idProd = event.target.idProd.value.trim();
    if (!idProd) {
        return mostrarMensaje("error", "Ingresa un ID valido");
    }

    try {
        const response = await fetch(`${urlBase}/api/products/${idProd}`);
        const data = await response.json();

        if (!response.ok) {
            return mostrarMensaje("error", data.message || "Producto no encontrado");
        }

        const producto = data.payload;
        renderizarProducto(producto);
    } catch (error) {
        console.error("Error al obtener producto: ", error);
        mostrarMensaje("error", "Error de conexion con el servidor");
    }
});

function renderizarProducto(producto) {
    const htmlProducto = `
        <div class="card-detalle-producto">
            <img src="${producto.image}" alt="${producto.name}" class="img-listados" onerror="this.src='/img/logo.jpg'">
            <div class="info-detalle">
                <h4>${producto.name}</h4>
                <p><strong>ID:</strong> ${producto.id} | <strong>Precio:</strong> $${Number(producto.price).toLocaleString('es-AR')}</p>
                <button type="button" id="btn-modificar" class="btn-editar">Editar este Producto</button>
            </div>
        </div>
    `;

    contenedorProductos.innerHTML = htmlProducto;

    document.getElementById("btn-modificar").addEventListener("click", () => {
        renderizarFormularioPut(producto);
    });
}

function renderizarFormularioPut(producto) {
    const htmlForm = `
        <div class="form-put-wrapper">
            <h4>Modificar Producto ID: ${producto.id}</h4>
            <form id="modifyProductForm">
                <input type="hidden" name="id" value="${producto.id}">

                <label for="editName">Nombre del Producto</label>
                <input type="text" name="name" id="editName" value="${producto.name}" required>

                <label for="editPrice">Precio ($)</label>
                <input type="number" name="price" id="editPrice" step="0.01" min="1" value="${producto.price}" required>

                <label for="editCategory">Categoria</label>
                <select name="category" id="editCategory" required>
                    <option value="perifericos" ${producto.category === 'perifericos' ? 'selected' : ''}>Perifericos</option>
                    <option value="componentes" ${producto.category === 'componentes' ? 'selected' : ''}>Componentes</option>
                </select>

                <label for="editImage">URL de la Imagen</label>
                <input type="url" name="image" id="editImage" value="${producto.image}" required>

                <label for="editActive">Estado</label>
                <select name="active" id="editActive" required>
                    <option value="1" ${producto.active ? 'selected' : ''}>Activo</option>
                    <option value="0" ${!producto.active ? 'selected' : ''}>Inactivo</option>
                </select>

                <input type="submit" value="Guardar Modificaciones">
            </form>
        </div>
    `;

    contenedorForm.innerHTML = htmlForm;

    document.getElementById("modifyProductForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const formObj = Object.fromEntries(formData.entries());

        formObj.price = Number(formObj.price);
        formObj.name = formObj.name.trim();
        formObj.image = formObj.image.trim();
        formObj.active = Number(formObj.active);

        const errores = validarFormulario(formObj);
        if (errores.length > 0) {
            return mostrarListaErrores(errores);
        }

        try {
            const response = await fetch(`${urlBase}/api/products`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formObj)
            });

            const data = await response.json();

            if (!response.ok) {
                return mostrarMensaje("error", data.message || "Error al modificar");
            }

            contenedorForm.innerHTML = "";
            mostrarMensaje("exito", data.message);
        } catch (error) {
            console.error("Error al modificar producto: ", error);
            mostrarMensaje("error", "Error de conexion con el servidor");
        }
    });
}
