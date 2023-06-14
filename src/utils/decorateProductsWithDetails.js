const axios = require("axios");
const USER_DETAILS_URL = require("../../constants").USER_DETAILS_URL;
const logger = require("./logger");

async function decorateProductsWithDetails(products) {
  try {
    const userIds = products.map((product) => product.user_id);

    const result = await axios.post(`${USER_DETAILS_URL}/userDetails/bulk`, {
      user_ids: userIds,
    });

    const users = result.data;

    logger({
      route: "/utils/decorateproductsWithDetails",
      statusCode: 200,
      message: "products decorated successfully",
    });

    return products.map((product) => ({
      ...product,
      userDetails: users.find((user) => user.user_id === product.owner_id),
    }));
  } catch (err) {
    logger({
      route: "/utils/decorateproductsWithDetails",
      statusCode: 500,
      message: "Something went wrong",
    });
  }

  return [];
}

module.exports = decorateProductsWithDetails;
