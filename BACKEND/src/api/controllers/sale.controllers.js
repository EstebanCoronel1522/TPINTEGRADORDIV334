import SaleModel from "../models/sale.model.js";

export const createSale = async (req, res) => {
    const products = req.body?.products;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "El carrito no contiene productos" });
    }

    const parsedProducts = [];
    const productIds = new Set();
    for (const item of products) {
        const id = Number(item?.id);
        const quantity = Number(item?.quantity);

        if (!Number.isInteger(id) || id <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0 || quantity > 999) {
            return res.status(400).json({ message: "El carrito contiene productos o cantidades inválidas" });
        }
        if (productIds.has(id)) {
            return res.status(400).json({ message: "El carrito contiene productos duplicados" });
        }

        productIds.add(id);
        parsedProducts.push({ id, quantity });
    }

    try {
        const sale = await SaleModel.insertSale(req.authUser, parsedProducts);
        res.status(201).json({ payload: sale });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.log("Error registrando la venta:", error);
        res.status(500).json({ message: "No se pudo registrar la compra" });
    }
};
