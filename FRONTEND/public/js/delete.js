const urlBase = window.location.origin || "http://localhost:3000";
const contenedorProductos = document.getElementById("contenedor-productos");
const getProductForm = document.getElementById("getProductForm");

function mostrarMensaje(tipo, mensaje) {
    contenedorProductos.innerHTML = `<p class="mensaje ${tipo}">${mensaje}</p>`;
}

getProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();
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
        renderizarProductoParaBaja(producto);
    } catch (error) {
        console.error("Error al obtener producto: ", error);
        mostrarMensaje("error", "Error de conexion con el servidor");
    }
});

function renderizarProductoParaBaja(producto) {
    const estado = producto.active ? "Activo" : "Inactivo";
    const textoToggle = producto.active ? "Desactivar (Baja Lógica)" : "Reactivar Producto";
    const nuevoEstado = producto.active ? 0 : 1;

    let htmlProducto = `
        <div class="card-detalle-producto">
            <img src="${producto.image}" alt="${producto.name}" class="img-listados" onerror="this.src='/img/logo.jpg'">
            <div class="info-detalle">
                <h4>${producto.name}</h4>
                <p><strong>ID:</strong> ${producto.id} | <strong>Estado actual:</strong> ${estado}</p>
                <div class="acciones-baja">
                    <button type="button" id="btn-toggle" class="btn-toggle">${textoToggle}</button>
                    <button type="button" id="btn-eliminar" class="btn-eliminar">Eliminar Permanentemente</button>
                </div>
            </div>
        </div>
    `;

    contenedorProductos.innerHTML = htmlProducto;

    // Baja lógica (toggle status)
    document.getElementById("btn-toggle").addEventListener("click", () => {
        const confirmacion = confirm(`¿Esta seguro de ${producto.active ? 'desactivar' : 'reactivar'} el producto '${producto.name}'?`);
        if (confirmacion) {
            cambiarEstado(producto.id, nuevoEstado);
        }
    });

    // Baja física (DELETE)
    document.getElementById("btn-eliminar").addEventListener("click", () => {
        const confirmacion = confirm(`¿Esta completamente seguro de ELIMINAR '${producto.name}' de la base de datos? Esta accion no se puede deshacer.`);
        if (confirmacion) {
            eliminarFisico(producto.id);
        }
    });
}

async function cambiarEstado(id, nuevoEstado) {
    try {
        const response = await fetch(`${urlBase}/api/products/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ active: nuevoEstado })
        });

        const data = await response.json();
        if (!response.ok) {
            return mostrarMensaje("error", data.message || "Error al actualizar estado");
        }

        mostrarMensaje("exito", data.message);
    } catch (error) {
        console.error("Error al alternar estado: ", error);
        mostrarMensaje("error", "Error de conexion con el servidor");
    }
}

async function eliminarFisico(id) {
    try {
        const response = await fetch(`${urlBase}/api/products/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();
        if (!response.ok) {
            return mostrarMensaje("error", data.message || "Error al eliminar producto");
        }

        mostrarMensaje("exito", data.message);
    } catch (error) {
        console.error("Error al eliminar producto: ", error);
        mostrarMensaje("error", "Error de conexion con el servidor");
    }
}
