const hotelModel = require("../models/hotel/basicDetails");
const reviewModel = require("../models/review");
const userModel = require("../models/user");

//======================================hotel review============================================
const createReview = async (req, res) => {
  try {
    const { userId, hotelId } = req.params;
    const { comment, rating } = req.body;

    // Fetch user and hotel concurrently
    const [user, hotel] = await Promise.all([
      userModel.findOne({ userId }),
      hotelModel.findOne({ hotelId }), // Use hotelId for hotel lookup
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }

    // Create a new review
    const review = new reviewModel({
      hotelId,
      userId,
      comment,
      rating,
      userName: user.userName,
      userImage: user.images[0],
      hotelName: hotel.hotelName,
      hotelImage: hotel.images[0],
    });

    // Save the review
    const savedReview = await review.save();

    // Increment the reviewCount for the hotel
    await hotelModel.findOneAndUpdate(
      { hotelId }, // Query by hotelId
      { $inc: { reviewCount: 1 } }, // Increment reviewCount by 1
      { new: true } // Return the updated document
    );

    // Respond with the saved review
    return res.status(201).json(savedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//===============================================================================================
const getReviewsByHotelId = async (req, res) => {
  try {
    const hotelId = req.query.hotelId;
    const reviews = await reviewModel.find({ hotelId });
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
//=======================================================================================================
const getReviewsByUserId = async (req, res) => {
  try {
    const userId = req.query.userId;
    const reviews = await reviewModel.find({ userId });
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found" });
    }
    res.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//=================================================================================================
const updateReview = async (req, res) => {
  try {
    const { userId, hotelId } = req.params; // Use params for review identification
    const { comment, rating } = req.body;

    // Find the review to update using both userId and hotelId for better security (assuming userId is the reviewer)
    const reviewToUpdate = await reviewModel.findOne({ userId, hotelId });

    if (!reviewToUpdate) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Update the review details (assuming comment and rating are the only modifiable fields)
    reviewToUpdate.comment = comment;
    reviewToUpdate.rating = rating;

    // Save the updated review
    const savedReview = await reviewToUpdate.save();

    return res.status(200).json(savedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================================================================================

const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  try {
    const result = await reviewModel.deleteOne({ _id: reviewId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
//===========================get all  reviews ==========================================
const findAllReviews = async function (req, res) {
  try {
    const fetchData = await reviewModel.find();
    return res.status(200).json(fetchData);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  createReview,
  getReviewsByHotelId,
  getReviewsByUserId,
  updateReview,
  deleteReview,
  findAllReviews,
};
