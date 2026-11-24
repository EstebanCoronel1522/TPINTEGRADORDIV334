const customerRedirectPaths = new Set([
    "/index.html",
    "/productos.html",
    "/carrito.html",
    "/ticket.html"
]);

export const getSafeCustomerRedirect = (path) => (
    customerRedirectPaths.has(path) ? path : "/index.html"
);
