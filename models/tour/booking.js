const mongoose = require("mongoose");

const passengerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["adult", "child"], required: true },
    fullName: { type: String, trim: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    dateOfBirth: { type: Date }, // mainly for child
  },
  { _id: false }
);

const tourBookingSchema = new mongoose.Schema(
  {
    // public booking code (PNR style)
    bookingCode: {
      type: String,
      unique: true,
      index: true,
      default: () =>
        [...Array(10)]
          .map(() => {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return chars.charAt(Math.floor(Math.random() * chars.length));
          })
          .join(""),
    },

    userId: { type: String, required: true, index: true },
    tourId: { type: String, required: true, index: true },
    vehicleId: { type: String, required: true },

    seats: { type: [String], default: [] }, // ["1A","1B"] etc.
    status: {
      type: String,
      enum: ["pending", "held", "confirmed", "cancelled", "failed"],
      default: "pending",
      index: true,
    },

    numberOfAdults: { type: Number, default: 1, min: 0 },
    numberOfChildren: { type: Number, default: 0, min: 0 },
    passengers: { type: [passengerSchema], default: [] },

    customizable: { type: Boolean, default: false },

    // snapshot fields (so booking stays same even if Tour changes later)
    travelAgencyName: { type: String },
    agencyPhone: { type: String },
    agencyEmail: { type: String },
    visitngPlaces: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    themes: { type: String },

    tourStartDate: { type: Date }, // if you need

    nights: { type: Number },
    days: { type: Number },
    from: { type: Date },
    to: { type: Date },

    // pricing snapshot
    basePrice: { type: Number, default: 0 }, // tour price
    seatPrice: { type: Number, default: 0 }, // (optional) seat add-on
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    // optional: store policy snapshot
    amenities: [String],
    inclusion: [String],
    exclusion: [String],
    termsAndConditions: { type: Map, of: String }, // Map type supported [web:60]
    dayWise: [{ day: Number, description: String }],

    // payment snapshot (optional)
    payment: {
      provider: String,
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date,
    },
  },
  { timestamps: true, strict: false }
);

// helpful indexes
tourBookingSchema.index({ userId: 1, createdAt: -1 });
tourBookingSchema.index({ tourId: 1, vehicleId: 1, createdAt: -1 });
tourBookingSchema.index({ bookingCode: 1 }, { unique: true });
tourBookingSchema.index({ status: 1 });

const TourBooking = mongoose.model("TourBooking", tourBookingSchema);
module.exports = TourBooking;
