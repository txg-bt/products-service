const axios = require("axios");
const USER_DETAILS_URL = require("../../constants").USER_DETAILS_URL;
const { logger } = require("./logger");

async function decorateReviewsWithDetails(reviews) {
  try {
    const userIds = reviews.map((review) => review.user_id);

    const result = await axios.post(`${USER_DETAILS_URL}/userDetails/bulk`, {
      user_ids: userIds,
    });

    const users = result.data;

    logger({
      route: "/utils/decorateReviewsWithDetails",
      statusCode: 200,
      message: "Reviews decorated successfully",
    });

    return reviews.map((review) => ({
      ...review,
      userDetails: users.find((user) => user.user_id === review.user_id),
    }));
  } catch (err) {
    logger({
      route: "/utils/decorateReviewsWithDetails",
      statusCode: 500,
      message: "Something went wrong",
    });
  }

  return [];
}

module.exports = decorateReviewsWithDetails;
