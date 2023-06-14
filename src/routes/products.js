const router = require("express").Router();
const { pool } = require("../database/database");
const authorization = require("../utils/authValidator");
const logger = require("../utils/logger");

router.get("/", async (req, res) => {
  try {
    const { offset, limit, search, category } = req.query;

    const products = await pool.query(
      `SELECT * FROM products
      WHERE LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1) AND category = $2
      ORDER BY id ASC
      OFFSET $3
      LIMIT $4`,
      [`%${search}%`, category, offset, limit]
    );

    logger({
      route: "/products",
      statusCode: 200,
      message: "Products retrieved successfully",
    });

    const decoratedProducts = await decorateProductsWithDetails(products.rows);

    res.status(200).json(decoratedProducts);
  } catch (err) {
    logger({
      route: "/products",
      statusCode: 500,
      message: "Something went wrong",
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/vendor/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const products = await pool.query(
      `SELECT * FROM products
      WHERE owner_id = $1`,
      [id]
    );

    logger({
      route: "/products/vendor/:id",
      statusCode: 200,
      message: "Products retrieved successfully",
    });

    const decoratedProducts = await decorateProductsWithDetails(products.rows);

    res.status(200).json(decoratedProducts);
  } catch (err) {
    logger({
      route: "/products/vendor/:id",
      statusCode: 500,
      message: "Something went wrong",
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await pool.query(
      `SELECT * FROM products
      WHERE id = $1`,
      [id]
    );

    logger({
      route: "/products/:id",
      statusCode: 200,
      message: "Product retrieved successfully",
    });

    const decoratedProduct = await decorateProductsWithDetails(product.rows);

    res.status(200).json(decoratedProduct[0]);
  } catch (err) {
    logger({
      route: "/products/:id",
      statusCode: 500,
      message: "Something went wrong",
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/bulk", async (req, res) => {
  const { products_ids } = req.body;

  try {
    const products = await pool.query(
      `SELECT * FROM products
      WHERE id = ANY($1)`,
      [products_ids]
    );

    logger({
      route: "/products/bulk",
      statusCode: 200,
      message: "Products retrieved successfully",
    });

    const decoratedProducts = await decorateProductsWithDetails(products.rows);

    res.status(200).json(decoratedProducts);
  } catch (err) {
    logger({
      route: "/products/bulk",
      statusCode: 500,
      message: "Something went wrong",
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/", authorization, async (req, res) => {
  const { user_id } = req;

  try {
    const { name, category, price, quantity, description, photo_url } =
      req.body;

    const product = await pool.query(
      `INSERT INTO products (name, category, price, quantity, owner_id, description, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, category, price, quantity, user_id, description, photo_url]
    );

    logger({
      route: "/products",
      statusCode: 201,
      message: "Product created successfully",
      userId: user_id,
    });

    res.status(201).json(product.rows[0]);
  } catch (err) {
    logger({
      route: "/products",
      statusCode: 500,
      message: "Something went wrong",
      userId: user_id,
    });

    res.status(500).send("Something went wrong");
  }
});

router.put("/quantity/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityUpdate } = req.body;

    const existingProduct = await pool.query(
      `SELECT * FROM products
      WHERE id = $1`,
      [id]
    );

    if (
      quantityUpdate > 0 &&
      existingProduct.rows?.[0].quantity < quantityUpdate
    ) {
      // 400
      logger({
        route: "/products/quantity/:id",
        statusCode: 400,
        message: "Not enough products in stock",
      });

      return res.status(400).send("Not enough products in stock");
    }

    const product = await pool.query(
      `UPDATE products
      SET quantity = quantity + $1
      WHERE id = $2
      RETURNING *`,
      [quantityUpdate, id]
    );

    logger({
      route: "/products/quantity/:id",
      statusCode: 200,
      message: "Product quantity updated successfully",
    });

    res.status(200).json(product.rows[0]);
  } catch (err) {
    logger({
      route: "/products/quantity/:id",
      statusCode: 500,
      message: "Something went wrong",
    });

    res.status(500).send("Something went wrong");
  }
});

router.put("/:id", authorization, async (req, res) => {
  const { user_id } = req;

  try {
    const { id } = req.params;
    const { name, category, price, quantity, description, photo_url } =
      req.body;

    const existingProduct = await pool.query(
      `SELECT * FROM products
      WHERE id = $1 AND owner_id = $2`,
      [id, user_id]
    );

    if (!existingProduct.rows?.[0]) {
      logger({
        route: "/products/:id",
        statusCode: 404,
        message: "Product not found",
        userId: user_id,
      });

      return res.status(404).json({ error: "Product not found" });
    }

    const product = await pool.query(
      `UPDATE products
      SET name = $1, category = $2, price = $3, quantity = $4, description = $5, photo_url = $6
      WHERE id = $7 AND owner_id = $8
      RETURNING *`,
      [
        name || existingProduct.rows[0].name,
        category || existingProduct.rows[0].category,
        price || existingProduct.rows[0].price,
        quantity || existingProduct.rows[0].quantity,
        description || existingProduct.rows[0].description,
        photo_url || existingProduct.rows[0].photo_url,
        id,
        user_id,
      ]
    );

    logger({
      route: "/products/:id",
      statusCode: 200,
      message: "Product updated successfully",
      userId: user_id,
    });

    res.status(200).json(product.rows[0]);
  } catch (err) {
    logger({
      route: "/products/:id",
      statusCode: 500,
      message: "Something went wrong",
      userId: user_id,
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", authorization, async (req, res) => {
  const { user_id } = req;

  try {
    const { id } = req.params;

    const product = await pool.query(
      `DELETE FROM products
      WHERE id = $1 AND owner_id = $2
      RETURNING *`,
      [id, user_id]
    );

    if (!product.rows?.[0]) {
      logger({
        route: "/products/:id",
        statusCode: 404,
        message: "Product not found",
        userId: user_id,
      });

      return res.status(404).json({ error: "Product not found" });
    }

    logger({
      route: "/products/:id",
      statusCode: 200,
      message: "Product deleted successfully",
      userId: user_id,
    });

    res.status(200).json(product.rows[0]);
  } catch (err) {
    logger({
      route: "/products/:id",
      statusCode: 500,
      message: "Something went wrong",
      userId: user_id,
    });

    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
