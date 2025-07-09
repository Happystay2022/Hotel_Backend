const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userName: String,
  userImage: String,
  hotelName: String,
  hotelImage: String,
  userId :String,
  hotelId :String,
  comment: {
    type: String,
    required: true,
  },
  rating: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
