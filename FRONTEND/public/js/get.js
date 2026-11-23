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
        renderizarProducto(producto);
    } catch (error) {
        console.error("Error al obtener producto: ", error);
        return mostrarMensaje("error", "Error de conexion con el servidor");
    }
});

function renderizarProducto(producto) {
    const estado = producto.active ? "Activo" : "Inactivo";
    const badgeClass = producto.active ? "badge-activo" : "badge-inactivo";

    let htmlProducto = `
        <div class="card-detalle-producto">
            <img src="${producto.image}" alt="${producto.name}" class="img-listados" onerror="this.src='/img/logo.jpg'">
            <div class="info-detalle">
                <h4>${producto.name}</h4>
                <p><strong>ID:</strong> ${producto.id}</p>
                <p><strong>Categoria:</strong> ${producto.category}</p>
                <p><strong>Precio:</strong> $${Number(producto.price).toLocaleString('es-AR')}</p>
                <p><strong>Estado:</strong> <span class="badge ${badgeClass}">${estado}</span></p>
            </div>
        </div>
    `;

    contenedorProductos.innerHTML = htmlProducto;
}
