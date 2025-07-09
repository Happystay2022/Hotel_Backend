const mongoose = require("mongoose");
const generateComplaintId = () => {
  const min = 10000000; // Minimum 8-digit number
  const max = 99999999; // Maximum 8-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    hotelId: {
      type: String,
      required: true,
    },
    hotelEmail: {
      type: String,
    },
    complaintId: {
      type: String,
      default: generateComplaintId,
    },
    regarding: {
      type: String,
      enum: ["Booking", "Hotel", "Website"],
    },
    hotelName: String,
    bookingId: String,
    feedBack: String,
    images: [String],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected", "Resolved", "Working"],
      default: "Pending",
    },
    updatedBy: {
      name: String,
      email: String,
    },
    issue: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Correct option for automatically managing createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
