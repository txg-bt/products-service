const router = require("express").Router();
const { pool } = require("../database/database");
const authorization = require("../utils/authValidator");
const { logger } = require("../utils/logger");
const decorateReviewsWithDetails = require("../utils/decorateReviewsWithDetails");

router.get("/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const reviews = await pool.query(
      `SELECT * FROM reviews
      WHERE product_id = $1`,
      [restaurantId]
    );

    logger({
      route: "/reviews/:restaurantId",
      statusCode: 200,
      message: "Reviews retrieved successfully",
    });

    const decoratedReviews = await decorateReviewsWithDetails(reviews.rows);

    res.status(200).json(decoratedReviews);
  } catch (err) {
    logger({
      route: "/reviews/:restaurantId",
      statusCode: 500,
      message: err.message,
    });

    res.status(500).json({ error: err.message });
  }
});

router.post("/:restaurantId", authorization, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { rating, comment } = req.body;

    const response = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [req.user_id, restaurantId, rating, comment]
    );

    logger({
      route: "/reviews/:restaurantId",
      statusCode: 200,
      message: "Review created successfully",
      userId: req.user_id,
    });

    res.status(200).json(response.rows[0]);
  } catch (err) {
    logger({
      route: "/reviews/:restaurantId",
      statusCode: 500,
      message: err.message,
      userId: req.user_id,
    });

    res.status(500).json({ error: err.message });
  }
});

router.delete("/:reviewId", authorization, async (req, res) => {
  const { user_id } = req;

  try {
    const { reviewId } = req.params;

    // check if reiws is owned by user
    const review = await pool.query(
      `SELECT * FROM reviews
      WHERE id = $1 AND user_id = $2`,
      [reviewId, user_id]
    );

    if (review.rows.length === 0) {
      logger({
        route: "/reviews/:reviewId",
        statusCode: 401,
        message: "Unauthorized",
        userId: user_id,
      });

      return res.status(401).send("Unauthorized");
    }

    await pool.query(
      `DELETE FROM reviews
      WHERE id = $1`,
      [reviewId]
    );

    logger({
      route: "/reviews/:reviewId",
      statusCode: 200,
      message: "Review deleted successfully",
      userId: user_id,
    });

    res.status(200).send("Review deleted successfully");
  } catch (err) {
    logger({
      route: "/reviews/:reviewId",
      statusCode: 500,
      message: err.message,
      userId: user_id,
    });

    res.status(500).send(err.message);
  }
});

module.exports = router;
