const router = require("express").Router();
const { pool } = require("../database/database");
const authorization = require("../utils/authValidator");
// const { logger } = require("../utils/logger");

const logger = () => {};

const decorateRestaurantsWithDetails = require("../utils/decorateRestaurantsWithDetails");

router.get("/", async (req, res) => {
  try {
    const { city, offset, limit } = req.query;

    const restaurants = await pool.query(
      `SELECT * FROM restaurants
      WHERE city ILIKE $1
      ORDER BY created_at DESC
      OFFSET $2
      LIMIT $3`,
      [city, offset, limit]
    );

    logger({
      route: "/restaurants",
      statusCode: 200,
      message: "Restaurants retrieved successfully",
    });

    const decoratedRestaurants = await decorateRestaurantsWithDetails(
      restaurants.rows
    );

    res.status(200).json(decoratedRestaurants);
  } catch (err) {
    logger({
      route: "/restaurants",
      statusCode: 500,
      message: err.message,
    });

    return res.status(500).send(err.message);
  }
});

router.get("/vendor", authorization, async (req, res) => {
  try {
    const { user_id } = req;

    const resturants = await pool.query(
      "SELECT * FROM restaurants WHERE owner_id = $1 ORDER BY created_at DESC",
      [user_id]
    );

    logger({
      route: "/restaurants/vendor",
      statusCode: 200,
      message: "Restaurants retrieved successfully",
    });

    return res.status(200).json(resturants.rows);
  } catch (err) {
    logger({
      route: "/restaurants/vendor",
      statusCode: 500,
      message: err.message,
    });

    return res.status(500).send(err.message);
  }
});

router.post("/", authorization, async (req, res) => {
  try {
    const { user_id } = req; // Accessing the user_id from the authorization middleware

    const { name, city, address, phone_number } = req.body; // Assuming the request body contains the necessary fields

    // Insert a new restaurant into the database
    const query = `
      INSERT INTO restaurants (owner_id, name, city, address, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [user_id, name, city, address, phone_number];

    const result = await pool.query(query, values);

    const newRestaurant = result.rows[0];

    logger({
      route: "/restaurants",
      statusCode: 201,
      message: "Restaurant created successfully",
    });

    return res.status(201).json(newRestaurant);
  } catch (err) {
    logger({
      route: "/restaurants",
      statusCode: 500,
      message: err.message,
    });

    return res.status(500).send(err.message);
  }
});

router.put("/:restaurantId", authorization, async (req, res) => {
  try {
    const { user_id } = req; // Accessing the user_id from the authorization middleware

    const { restaurantId } = req.params; // Accessing the restaurantId from the route parameters
    const { name, city, address, phone_number } = req.body; // Assuming the request body contains the necessary fields

    // Fetch the existing restaurant details from the database
    const existingRestaurantQuery = `
      SELECT * FROM restaurants WHERE restaurant_id = $1 AND owner_id = $2
    `;
    const existingRestaurantResult = await pool.query(existingRestaurantQuery, [
      restaurantId,
      user_id,
    ]);
    const existingRestaurant = existingRestaurantResult.rows[0];

    if (!existingRestaurant) {
      logWritter("Updating restaurant - not found");

      return res.status(404).send("Restaurant not found");
    }

    // Set default values using the existing restaurant details
    const defaultName = existingRestaurant.name;
    const defaultCity = existingRestaurant.city;
    const defaultAddress = existingRestaurant.address;
    const defaultPhoneNumber = existingRestaurant.phone_number;

    // Use default values if the fields are not provided
    const updatedName = name || defaultName;
    const updatedCity = city || defaultCity;
    const updatedAddress = address || defaultAddress;
    const updatedPhoneNumber = phone_number || defaultPhoneNumber;

    // Update the restaurant in the database
    const updateQuery = `
      UPDATE restaurants
      SET name = $1, city = $2, address = $3, phone_number = $4
      WHERE restaurant_id = $5
    `;

    const updateValues = [
      updatedName,
      updatedCity,
      updatedAddress,
      updatedPhoneNumber,
      restaurantId,
    ];

    await pool.query(updateQuery, updateValues);

    logger({
      route: "/restaurants/:restaurantId",
      statusCode: 200,
      message: "Restaurant updated successfully",
    });

    return res.status(200).json({ message: "Restaurant updated successfully" });
  } catch (err) {
    logger({
      route: "/restaurants/:restaurantId",
      statusCode: 500,
      message: err.message,
    });

    return res.status(500).send(err.message);
  }
});

router.delete("/:restaurantId", authorization, async (req, res) => {
  try {
    const { user_id } = req; // Accessing the user_id from the authorization middleware

    const { restaurantId } = req.params; // Accessing the restaurantId from the route parameters

    // Check if the restaurant exists
    const existingRestaurantQuery = `
      SELECT * FROM restaurants WHERE restaurant_id = $1 AND owner_id = $2
    `;

    const existingRestaurantResult = await pool.query(existingRestaurantQuery, [
      restaurantId,
      user_id,
    ]);

    const existingRestaurant = existingRestaurantResult.rows[0];

    if (!existingRestaurant) {
      logger({
        route: "/restaurants/:restaurantId",
        statusCode: 404,
        message: "Restaurant not found",
      });

      return res.status(404).send("Restaurant not found");
    }

    await pool.query(`DELETE FROM reservations WHERE restaurant_id = $1`, [
      restaurantId,
    ]);

    logger({
      route: "/restaurants/:restaurantId",
      statusCode: 200,
      message: "Restaurant deleted successfully",
    });

    return res.status(200).send("Restaurant deleted successfully");
  } catch (err) {
    logWritter(err.message);

    return res.status(500).send(err.message);
  }
});

module.exports = router;
