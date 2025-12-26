const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Innova"
    vehicleNumber: { type: String }, // optional
    totalSeats: { type: Number, required: true, min: 1 },
    seaterType: { type: String }, // e.g. "2x2", "2x3", "3x2", "2x1" - seating configuration
    seatLayout: { type: [String], default: [] }, // e.g. ["1A","1B","2A"...]
    bookedSeats: { type: [String], default: [] }, // booked seat codes
    pricePerSeat: { type: Number, default: 0 }, // optional add-on
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const tourSchema = new mongoose.Schema(
  {
    travelAgencyName: String,
    agencyId: String,
    agencyPhone: String,
    agencyEmail: String,
    isAccepted: { type: Boolean, default: false },

    country: String,
    state: String,
    city: String,
    visitngPlaces: String,
    themes: String,

    price: Number,
    nights: Number,
    days: Number,
    from: Date,
    to: Date,

    amenities: [String],
    inclusion: [String],
    exclusion: [String],

    termsAndConditions: { type: Map, of: String },

    dayWise: [{ day: Number, description: String }],

    starRating: { type: Number, min: 1, max: 5 },
    images: [String],

    // NEW: vehicles inventory
    vehicles: { type: [vehicleSchema], default: [] },
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model("Tour", tourSchema);
