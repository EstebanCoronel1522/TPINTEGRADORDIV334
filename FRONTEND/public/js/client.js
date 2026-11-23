/* ==============================================
    TechStore Autoservicio - Logica del Cliente
    Manejo de Carrito, API/JSON, Tema y jsPDF
============================================== */

const API_BASE_URL = window.location.origin || "http://localhost:3000";

// =================== GESTION DEL TEMA ===================
function initTheme() {
    const savedTheme = localStorage.getItem("autoservicio_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeButton(savedTheme);

    const themeToggleBtn = document.getElementById("themeToggle");
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("autoservicio_theme", newTheme);
            updateThemeButton(newTheme);
        });
    }
}

function updateThemeButton(theme) {
    const themeToggleBtn = document.getElementById("themeToggle");
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    }
}

// =================== GESTION DEL CARRITO ===================
function getCart() {
    try {
        return JSON.parse(localStorage.getItem("autoservicio_cart")) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("autoservicio_cart", JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badges = document.querySelectorAll(".cart-badge");
    badges.forEach(b => {
        b.textContent = totalCount;
    });
}

function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            category: product.category,
            quantity: quantity
        });
    }

    saveCart(cart);
}

function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart(cart);
        renderCartPage();
    }
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== productId);
    saveCart(cart);
    renderCartPage();
}

// =================== PANTALLA: BIENVENIDA (index.html) ===================
function initWelcomePage() {
    const welcomeForm = document.getElementById("welcomeForm");
    if (!welcomeForm) return;

    // Si ya habia un nombre guardado, lo sugiere
    const savedName = localStorage.getItem("autoservicio_usuario");
    if (savedName) {
        const input = document.getElementById("userName");
        if (input) input.value = savedName;
    }

    welcomeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userNameInput = document.getElementById("userName");
        const name = userNameInput ? userNameInput.value.trim() : "";

        if (!name) {
            alert("Por favor, ingrese su nombre para continuar.");
            return;
        }

        // Guarda el nombre en localStorage
        localStorage.setItem("autoservicio_usuario", name);

        // Redirige a la pantalla de productos
        window.location.href = "productos.html";
    });
}

// =================== PANTALLA: PRODUCTOS (productos.html) ===================
let allProducts = [];
let currentCategory = "todos";
let currentPage = 1;
const PRODUCTS_PER_PAGE = 6;

async function initProductsPage() {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    // Validar que el usuario haya ingresado su nombre
    const userName = localStorage.getItem("autoservicio_usuario");
    if (!userName) {
        alert("Debe ingresar su nombre antes de ver los productos.");
        window.location.href = "index.html";
        return;
    }

    // Saludo al usuario
    const userGreeting = document.getElementById("userGreeting");
    if (userGreeting) {
        userGreeting.textContent = `¡Hola, ${userName}!`;
    }

    // Obtener productos desde API o fallback JSON
    await loadProducts();

    // Eventos de categorías
    const categoryBtns = document.querySelectorAll(".category-btn");
    categoryBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.getAttribute("data-category");
            currentPage = 1;
            renderProducts();
        });
    });
}

async function loadProducts() {
    const productsContainer = document.getElementById("productsContainer");
    productsContainer.innerHTML = `<p class="centrado" style="grid-column: 1/-1;">Cargando catálogo de productos...</p>`;

    try {
        // Intentamos cargar de la API REST activa
        const response = await fetch(`${API_BASE_URL}/api/products/active`);
        if (!response.ok) throw new Error("API no disponible");
        const data = await response.json();
        allProducts = data.payload || [];
    } catch (err) {
        console.warn("No se pudo conectar a la API. Usando JSON hardcodeado de respaldo:", err);
        try {
            const fallbackResponse = await fetch("data/products.json");
            allProducts = await fallbackResponse.json();
        } catch (fallbackErr) {
            console.error("Error al cargar JSON de respaldo:", fallbackErr);
            productsContainer.innerHTML = `<p class="mensaje error">Error al cargar productos.</p>`;
            return;
        }
    }

    renderProducts();
}

function renderProducts() {
    const productsContainer = document.getElementById("productsContainer");
    const paginationContainer = document.getElementById("paginationContainer");
    if (!productsContainer) return;

    // Filtrar por categoría
    let filtered = allProducts;
    if (currentCategory !== "todos") {
        filtered = allProducts.filter(p => p.category === currentCategory);
    }

    if (filtered.length === 0) {
        productsContainer.innerHTML = `<p class="centrado" style="grid-column: 1/-1;">No hay productos disponibles en esta categoría.</p>`;
        if (paginationContainer) paginationContainer.innerHTML = "";
        return;
    }

    // Paginación
    const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const paginatedItems = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

    // Render tarjetas
    productsContainer.innerHTML = paginatedItems.map(p => `
        <div class="product-card">
            <img class="product-image" src="${p.image}" alt="${p.name}" onerror="this.src='img/logo.jpg'">
            <div class="product-body">
                <div>
                    <span class="product-tag">${p.category}</span>
                    <h3 class="product-name">${p.name}</h3>
                </div>
                <div>
                    <div class="product-price">$${Number(p.price).toLocaleString('es-AR')}</div>
                    <div class="product-actions">
                        <button class="btn-primary" style="flex: 1;" onclick="handleAddToCart(${p.id})">
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join("");

    // Render paginador
    if (paginationContainer) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = "";
        } else {
            let pagHtml = "";
            for (let i = 1; i <= totalPages; i++) {
                pagHtml += `
                    <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                        ${i}
                    </button>
                `;
            }
            paginationContainer.innerHTML = pagHtml;
        }
    }
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleAddToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCart(product, 1);
        alert(`¡'${product.name}' se agregó al carrito!`);
    }
}

// =================== PANTALLA: CARRITO (carrito.html) ===================
function initCartPage() {
    const cartTableBody = document.getElementById("cartTableBody");
    if (!cartTableBody) return;

    renderCartPage();

    // Modal de confirmación de compra
    const btnCheckout = document.getElementById("btnCheckout");
    const confirmModal = document.getElementById("confirmModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const btnConfirmOrder = document.getElementById("btnConfirmOrder");

    if (btnCheckout && confirmModal) {
        btnCheckout.addEventListener("click", () => {
            const cart = getCart();
            if (cart.length === 0) {
                alert("El carrito está vacío. Agregue productos antes de continuar.");
                return;
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const modalTotalText = document.getElementById("modalTotalText");
            if (modalTotalText) {
                modalTotalText.textContent = `$${total.toLocaleString('es-AR')}`;
            }

            confirmModal.classList.add("active");
        });
    }

    if (btnCancelModal && confirmModal) {
        btnCancelModal.addEventListener("click", () => {
            confirmModal.classList.remove("active");
        });
    }

    if (btnConfirmOrder) {
        btnConfirmOrder.addEventListener("click", () => {
            finalizarCompra();
        });
    }
}

function renderCartPage() {
    const cartTableBody = document.getElementById("cartTableBody");
    const cartEmptyMsg = document.getElementById("cartEmptyMsg");
    const cartContent = document.getElementById("cartContent");
    const cartTotalDisplay = document.getElementById("cartTotalDisplay");

    if (!cartTableBody) return;

    const cart = getCart();

    if (cart.length === 0) {
        if (cartEmptyMsg) cartEmptyMsg.style.display = "block";
        if (cartContent) cartContent.style.display = "none";
        return;
    }

    if (cartEmptyMsg) cartEmptyMsg.style.display = "none";
    if (cartContent) cartContent.style.display = "block";

    let total = 0;
    cartTableBody.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <tr>
                <td>
                    <img class="cart-thumb" src="${item.image}" alt="${item.name}" onerror="this.src='img/logo.jpg'">
                </td>
                <td>
                    <strong>${item.name}</strong><br>
                    <small style="color: var(--text-muted);">${item.category}</small>
                </td>
                <td>$${item.price.toLocaleString('es-AR')}</td>
                <td>
                    <div class="quantity-control">
                        <button class="btn-qty" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="btn-qty" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td><strong>$${subtotal.toLocaleString('es-AR')}</strong></td>
                <td>
                    <button class="btn-qty" style="color: var(--danger); width: auto; padding: 0 0.5rem;" onclick="removeFromCart(${item.id})">
                        ✕
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    if (cartTotalDisplay) {
        cartTotalDisplay.textContent = `$${total.toLocaleString('es-AR')}`;
    }
}

function finalizarCompra() {
    const cart = getCart();
    const userName = localStorage.getItem("autoservicio_usuario") || "Cliente";
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = Math.floor(100000 + Math.random() * 900000);

    const ticketData = {
        orderId: orderId,
        userName: userName,
        date: new Date().toLocaleString('es-AR'),
        items: cart,
        total: total
    };

    // Guardar ticket en localStorage para la pantalla ticket.html
    localStorage.setItem("autoservicio_ticket", JSON.stringify(ticketData));

    // Opcional: Intentar registrar la venta en la base de datos
    fetch(`${API_BASE_URL}/api/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_name: userName,
            total_price: total,
            products: cart.map(i => ({ id: i.id, quantity: i.quantity }))
        })
    }).catch(err => console.log("Nota: Guardado local de venta completado."));

    // Limpiar carrito activo
    localStorage.removeItem("autoservicio_cart");
    updateCartBadge();

    // Redirigir al ticket
    window.location.href = "ticket.html";
}

// =================== PANTALLA: TICKET (ticket.html) ===================
function initTicketPage() {
    const ticketContainer = document.getElementById("ticketContainer");
    if (!ticketContainer) return;

    let ticket = null;
    try {
        ticket = JSON.parse(localStorage.getItem("autoservicio_ticket"));
    } catch {
        ticket = null;
    }

    if (!ticket) {
        ticketContainer.innerHTML = `
            <div class="welcome-card">
                <h3>No hay ticket disponible</h3>
                <p>No se encontró ninguna compra reciente para mostrar.</p>
                <a href="index.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">Ir al Inicio</a>
            </div>
        `;
        return;
    }

    // Renderizar datos del ticket
    const ticketOrderId = document.getElementById("ticketOrderId");
    const ticketDate = document.getElementById("ticketDate");
    const ticketUser = document.getElementById("ticketUser");
    const ticketTableBody = document.getElementById("ticketTableBody");
    const ticketTotal = document.getElementById("ticketTotal");

    if (ticketOrderId) ticketOrderId.textContent = `#${ticket.orderId}`;
    if (ticketDate) ticketDate.textContent = ticket.date;
    if (ticketUser) ticketUser.textContent = ticket.userName;
    if (ticketTotal) ticketTotal.textContent = `$${ticket.total.toLocaleString('es-AR')}`;

    if (ticketTableBody && ticket.items) {
        ticketTableBody.innerHTML = ticket.items.map(item => `
            <tr>
                <td>${item.quantity}x</td>
                <td>${item.name}</td>
                <td style="text-align: right;">$${(item.price * item.quantity).toLocaleString('es-AR')}</td>
            </tr>
        `).join("");
    }

    // Botón descargar PDF con jsPDF
    const btnDownloadPdf = document.getElementById("btnDownloadPdf");
    if (btnDownloadPdf) {
        btnDownloadPdf.addEventListener("click", () => {
            generarPdfTicket(ticket);
        });
    }

    // Botón salir / nueva compra (reinicia el autoservicio)
    const btnRestart = document.getElementById("btnRestart");
    if (btnRestart) {
        btnRestart.addEventListener("click", () => {
            localStorage.removeItem("autoservicio_usuario");
            localStorage.removeItem("autoservicio_ticket");
            localStorage.removeItem("autoservicio_cart");
            window.location.href = "index.html";
        });
    }
}

// Generación de PDF usando jsPDF
function generarPdfTicket(ticket) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("La librería jsPDF no está cargada correctamente.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 160] // Tamaño recibo térmico / autoservicio
    });

    let y = 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("TechStore Autoservicio", 40, y, { align: "center" });

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("División 334 - UTN Programación III", 40, y, { align: "center" });

    y += 6;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);

    y += 5;
    doc.text(`Ticket: #${ticket.orderId}`, 5, y);
    y += 4;
    doc.text(`Fecha: ${ticket.date}`, 5, y);
    y += 4;
    doc.text(`Cliente: ${ticket.userName}`, 5, y);

    y += 4;
    doc.line(5, y, 75, y);

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Cant.  Descripción", 5, y);
    doc.text("Subtotal", 75, y, { align: "right" });

    y += 4;
    doc.setFont("helvetica", "normal");
    ticket.items.forEach(item => {
        const sub = `$${(item.price * item.quantity).toLocaleString('es-AR')}`;
        const nameShort = item.name.length > 20 ? item.name.substring(0, 19) + "..." : item.name;
        doc.text(`${item.quantity}x   ${nameShort}`, 5, y);
        doc.text(sub, 75, y, { align: "right" });
        y += 4;
    });

    y += 2;
    doc.line(5, y, 75, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL:", 5, y);
    doc.text(`$${ticket.total.toLocaleString('es-AR')}`, 75, y, { align: "right" });

    y += 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("¡Gracias por su compra!", 40, y, { align: "center" });

    doc.save(`Ticket_TechStore_${ticket.orderId}.pdf`);
}

// Inicialización global según página
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateCartBadge();

    initWelcomePage();
    initProductsPage();
    initCartPage();
    initTicketPage();
});
