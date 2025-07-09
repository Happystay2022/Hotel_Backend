const mongoose = require('mongoose');

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
    termsAndConditions: {
      type: Map,
      of: String,
    },
    dayWise: [
      {
        day: Number,
        description: String,
      },
    ],
    starRating: { type: Number, min: 1, max: 5 },
    images: [String],
  },
  { timestamps: true, strict: false }
);

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
