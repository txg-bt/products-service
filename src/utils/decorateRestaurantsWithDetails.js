const axios = require("axios");
const USER_DETAILS_URL = require("../../constants").USER_DETAILS_URL;
const { logger } = require("./logger");

async function decorateRestaurantsWithDetails(restaurants) {
  try {
    const userIds = restaurants.map((product) => product.user_id);

    const result = await axios.post(`${USER_DETAILS_URL}/userDetails/bulk`, {
      user_ids: userIds,
    });

    const users = result.data;

    logger({
      route: "/utils/decorateRestaurantsWithDetails",
      statusCode: 200,
      message: "restaurants decorated successfully",
    });

    return restaurants.map((product) => ({
      ...product,
      userDetails: users.find((user) => user.user_id === product.owner_id),
    }));
  } catch (err) {
    logger({
      route: "/utils/decorateRestaurantsWithDetails",
      statusCode: 500,
      message: err.message,
    });
  }

  return [];
}

module.exports = decorateRestaurantsWithDetails;
