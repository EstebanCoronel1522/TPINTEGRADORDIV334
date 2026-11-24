import connection from "../database/database.js";

export const insertSale = async (user, products) => {
    const database = await connection.getConnection();
    let transactionStarted = false;

    try {
        await database.beginTransaction();
        transactionStarted = true;

        const ids = products.map((product) => product.id);
        const [databaseProducts] = await database.query(
            "SELECT id, name, image, category, price FROM products WHERE active = 1 AND id IN (?) FOR UPDATE",
            [ids]
        );

        if (databaseProducts.length !== ids.length) {
            const error = new Error("Uno o más productos ya no están disponibles");
            error.statusCode = 400;
            throw error;
        }

        const productById = new Map(databaseProducts.map((product) => [product.id, product]));
        const saleProducts = products.map((item) => {
            const product = productById.get(item.id);
            return {
                id: product.id,
                name: product.name,
                image: product.image,
                category: product.category,
                price: Number(product.price),
                quantity: item.quantity
            };
        });
        const totalCents = saleProducts.reduce(
            (total, product) => total + Math.round(product.price * 100) * product.quantity,
            0
        );
        const totalPrice = totalCents / 100;

        const [saleResult] = await database.execute(
            "INSERT INTO sales (total_price, user_name) VALUES (?, ?)",
            [totalPrice, user.name]
        );

        for (const product of saleProducts) {
            await database.execute(
                "INSERT INTO product_sales (product_id, sale_id, quantity) VALUES (?, ?, ?)",
                [product.id, saleResult.insertId, product.quantity]
            );
        }

        const [[sale]] = await database.execute(
            "SELECT id, date, total_price, user_name FROM sales WHERE id = ?",
            [saleResult.insertId]
        );

        await database.commit();
        transactionStarted = false;
        return { ...sale, products: saleProducts };
    } catch (error) {
        if (transactionStarted) {
            await database.rollback();
        }
        throw error;
    } finally {
        database.release();
    }
};

export default { insertSale };
