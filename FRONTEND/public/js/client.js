/* ==============================================
    TechStore Autoservicio - Logica del Cliente
    Manejo de Carrito, API/JSON, Tema y jsPDF
============================================== */

const API_BASE_URL = window.location.origin || "http://localhost:3000";
let authenticatedUser = null;

async function getAuthenticatedUser() {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        cache: "no-store",
        credentials: "same-origin"
    });
    if (response.status === 401) return null;

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "No se pudo verificar la sesión");
    }

    return data.payload;
}

async function updateAuthNavigation(loginLink, logoutForm) {
    loginLink.hidden = true;
    logoutForm.hidden = true;

    try {
        const user = await getAuthenticatedUser();
        setAuthenticatedUser(user);
        if (user) {
            logoutForm.hidden = false;
        } else {
            loginLink.hidden = false;
        }
    } catch (error) {
        console.error("No se pudo actualizar la navegación de sesión:", error);
        setAuthenticatedUser(null);
        loginLink.hidden = false;
    }
}

function setAuthenticatedUser(user) {
    const userId = user ? String(user.id) : null;
    const cartOwnerId = localStorage.getItem("autoservicio_cart_owner");
    if (!userId || cartOwnerId !== userId) {
        localStorage.removeItem("autoservicio_cart");
    }

    if (userId) {
        localStorage.setItem("autoservicio_cart_owner", userId);
    } else {
        localStorage.removeItem("autoservicio_cart_owner");
        localStorage.removeItem("autoservicio_usuario");
    }

    authenticatedUser = user;
    updateCartBadge();
    document.dispatchEvent(new Event("auth-state-changed"));
}

function initAuthNavigation() {
    const loginLink = document.getElementById("authLoginLink");
    const logoutForm = document.getElementById("authLogoutForm");
    if (!loginLink || !logoutForm) return Promise.resolve(null);

    logoutForm.addEventListener("submit", () => {
        localStorage.removeItem("autoservicio_cart");
        localStorage.removeItem("autoservicio_cart_owner");
        localStorage.removeItem("autoservicio_ticket");
        localStorage.removeItem("autoservicio_usuario");
    });

    const refreshNavigation = () => updateAuthNavigation(loginLink, logoutForm);
    const initialAuthCheck = refreshNavigation();
    window.addEventListener("focus", refreshNavigation);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            refreshNavigation();
        }
    });
    return initialAuthCheck;
}

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
    if (!authenticatedUser
        || localStorage.getItem("autoservicio_cart_owner") !== String(authenticatedUser.id)) {
        localStorage.removeItem("autoservicio_cart");
        return [];
    }

    try {
        return JSON.parse(localStorage.getItem("autoservicio_cart")) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    if (!authenticatedUser) {
        localStorage.removeItem("autoservicio_cart");
        localStorage.removeItem("autoservicio_cart_owner");
        updateCartBadge();
        return;
    }

    localStorage.setItem("autoservicio_cart", JSON.stringify(cart));
    localStorage.setItem("autoservicio_cart_owner", String(authenticatedUser.id));
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
    if (!authenticatedUser) return;

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

async function updateQuantity(productId, delta) {
    if (delta > 0) {
        try {
            const user = await getAuthenticatedUser();
            setAuthenticatedUser(user);
            if (!user) {
                window.location.href = "/login?next=%2Fcarrito.html";
                return;
            }
        } catch (error) {
            console.error("Error verificando autenticación:", error);
            alert("No se pudo verificar la sesión. Inténtalo nuevamente.");
            return;
        }
    }

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

// =================== PANTALLA: PRODUCTOS (productos.html) ===================
let allProducts = [];
let currentCategory = "todos";
let currentPage = 1;
const PRODUCTS_PER_PAGE = 6;

async function initProductsPage() {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    const userGreeting = document.getElementById("userGreeting");
    const updateGreeting = () => {
        if (userGreeting) {
            userGreeting.textContent = authenticatedUser
                ? `¡Hola, ${authenticatedUser.name}!`
                : "Catálogo de Productos";
        }
        if (allProducts.length > 0) renderProducts();
    };
    document.addEventListener("auth-state-changed", updateGreeting);
    updateGreeting();

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

const DEFAULT_PRODUCTS = [
    { id: 1, name: "Teclado Mecánico RGB Redragon Kumara", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 45000.00, active: 1 },
    { id: 2, name: "Mouse Gamer Logitech G502 Hero", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 38000.00, active: 1 },
    { id: 3, name: "Auriculares HyperX Cloud Flight Wireless", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 82000.00, active: 1 },
    { id: 4, name: "Mousepad XXL Gaming Speed", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 18000.00, active: 1 },
    { id: 5, name: "Micrófono Condensador USB FIFINE", image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 52000.00, active: 1 },
    { id: 6, name: "Webcam Logitech C920 Full HD", image: "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80", category: "perifericos", price: 65000.00, active: 1 },
    { id: 7, name: "Memoria RAM Corsair Vengeance 16GB DDR4", image: "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 42000.00, active: 1 },
    { id: 8, name: "Disco SSD NVMe Kingston 1TB M.2", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 68000.00, active: 1 },
    { id: 9, name: "Placa de Video GeForce RTX 4060 8GB", image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 340000.00, active: 1 },
    { id: 10, name: "Fuente de Poder Gigabyte 750W 80 Plus Gold", image: "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 95000.00, active: 1 },
    { id: 11, name: "Gabinete ATX Cooler Master Vidrio Templado", image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 78000.00, active: 1 },
    { id: 12, name: "Cooler CPU Deepcool Gammaxx AG400", image: "https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=600&q=80", category: "componentes", price: 29000.00, active: 1 }
];

async function loadProducts() {
    const productsContainer = document.getElementById("productsContainer");
    productsContainer.innerHTML = `<p class="centrado" style="grid-column: 1/-1;">Cargando catálogo de productos...</p>`;

    try {
        // 1. Intentamos cargar desde la API REST si el backend está activo
        const response = await fetch(`${API_BASE_URL}/api/products/active`);
        if (!response.ok) throw new Error("API no disponible");
        const data = await response.json();
        allProducts = data.payload || [];
    } catch (err) {
        console.warn("API REST no detectada. Intentando cargar archivo JSON local:", err.message);
        try {
            // 2. Intentamos cargar el archivo products.json
            const fallbackResponse = await fetch("data/products.json");
            allProducts = await fallbackResponse.json();
        } catch (fallbackErr) {
            // 3. Fallback de respaldo interno (útil si se abre directamente por file://)
            console.warn("Cargando catálogo de respaldo integrado en memoria:", fallbackErr.message);
            allProducts = DEFAULT_PRODUCTS;
        }
    }

    renderProducts();
}

function renderProducts() {
    const productsContainer = document.getElementById("productsContainer");
    const paginationContainer = document.getElementById("paginationContainer");
    if (!productsContainer) return;

    // Filtrar por categoría
    let filtered = allProducts.slice();
    if (currentCategory !== "todos") {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    filtered.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

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
                        ${authenticatedUser
                            ? `<button class="btn-primary" style="flex: 1;" onclick="handleAddToCart(${p.id})">Agregar al Carrito</button>`
                            : `<a class="btn-primary" style="flex: 1; text-align: center; text-decoration: none;" href="/login?next=%2Fproductos.html">Iniciar sesión para agregar</a>`}
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

async function handleAddToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    try {
        const user = await getAuthenticatedUser();
        setAuthenticatedUser(user);
        if (!user) {
            window.location.href = "/login?next=%2Fproductos.html";
            return;
        }

        addToCart(product, 1);
        alert(`¡'${product.name}' se agregó al carrito!`);
    } catch (error) {
        console.error("Error verificando autenticación:", error);
        alert("No se pudo verificar la sesión. Inténtalo nuevamente.");
    }
}

// =================== PANTALLA: CARRITO (carrito.html) ===================
function initCartPage() {
    const cartTableBody = document.getElementById("cartTableBody");
    if (!cartTableBody) return;

    renderCartPage();
    document.addEventListener("auth-state-changed", renderCartPage);

    // Modal de confirmación de compra
    const btnCheckout = document.getElementById("btnCheckout");
    const confirmModal = document.getElementById("confirmModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const btnConfirmOrder = document.getElementById("btnConfirmOrder");

    if (btnCheckout && confirmModal) {
        btnCheckout.addEventListener("click", async () => {
            const cart = getCart();
            if (cart.length === 0) {
                alert("El carrito está vacío. Agregue productos antes de continuar.");
                return;
            }

            try {
                const user = await getAuthenticatedUser();
                if (!user) {
                    window.location.href = "/login?next=%2Fcarrito.html";
                    return;
                }
            } catch (error) {
                console.error("Error verificando autenticación:", error);
                alert(error.message);
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
            finalizarCompra(btnConfirmOrder);
        });
    }
}

function renderCartPage() {
    const cartTableBody = document.getElementById("cartTableBody");
    const cartEmptyMsg = document.getElementById("cartEmptyMsg");
    const cartContent = document.getElementById("cartContent");
    const cartTotalDisplay = document.getElementById("cartTotalDisplay");
    const cartEmptyDescription = document.getElementById("cartEmptyDescription");
    const cartEmptyLogin = document.getElementById("cartEmptyLogin");

    if (!cartTableBody) return;

    const cart = getCart();

    if (cart.length === 0) {
        if (cartEmptyMsg) cartEmptyMsg.style.display = "block";
        if (cartContent) cartContent.style.display = "none";
        if (cartEmptyDescription) {
            cartEmptyDescription.textContent = authenticatedUser
                ? "Aún no ha seleccionado productos para su compra."
                : "Inicia sesión para agregar productos a tu carrito.";
        }
        if (cartEmptyLogin) {
            cartEmptyLogin.style.display = authenticatedUser ? "none" : "inline-block";
        }
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

async function finalizarCompra(confirmButton) {
    const cart = getCart();
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    confirmButton.disabled = true;
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            window.location.href = "/login?next=%2Fcarrito.html";
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/sales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                products: cart.map(item => ({ id: item.id, quantity: item.quantity }))
            })
        });
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = "/login?next=%2Fcarrito.html";
            return;
        }
        if (!response.ok) {
            throw new Error(data.message || "No se pudo registrar la compra");
        }

        const sale = data.payload;
        const ticketData = {
            orderId: sale.id,
            userId: user.id,
            userName: sale.user_name,
            date: new Date(sale.date).toLocaleString("es-AR"),
            items: sale.products,
            total: Number(sale.total_price)
        };
        localStorage.setItem("autoservicio_ticket", JSON.stringify(ticketData));
        localStorage.removeItem("autoservicio_cart");
        updateCartBadge();
        window.location.href = "ticket.html";
    } catch (error) {
        console.error("Error al finalizar la compra:", error);
        alert(error.message);
        confirmButton.disabled = false;
    }
}

// =================== PANTALLA: TICKET (ticket.html) ===================
async function initTicketPage() {
    const ticketContainer = document.getElementById("ticketContainer");
    if (!ticketContainer) return;

    let ticket = null;
    try {
        ticket = JSON.parse(localStorage.getItem("autoservicio_ticket"));
    } catch (error) {
        console.error("No se pudo leer el ticket guardado:", error);
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

    let user;
    try {
        user = await getAuthenticatedUser();
    } catch (error) {
        console.error("No se pudo verificar la sesión para mostrar el ticket:", error);
        ticketContainer.innerHTML = `<p class="mensaje error">No se pudo verificar la sesión.</p>`;
        return;
    }

    if (!user) {
        window.location.href = "/login?next=%2Fticket.html";
        return;
    }
    if (Number(ticket.userId) !== Number(user.id)) {
        ticketContainer.innerHTML = `
            <div class="welcome-card">
                <h3>Ticket no disponible</h3>
                <p>Este comprobante pertenece a otra cuenta.</p>
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
            localStorage.removeItem("autoservicio_ticket");
            localStorage.removeItem("autoservicio_cart");
            localStorage.removeItem("autoservicio_cart_owner");
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
    const authReady = initAuthNavigation();
    initTheme();
    authReady.then(() => {
        updateCartBadge();

        initProductsPage();
        initCartPage();
        initTicketPage();
    });
});
