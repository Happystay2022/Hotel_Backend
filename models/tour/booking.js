const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            unique: true,
            default: () =>
                [...Array(10)]
                    .map(() => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        return chars.charAt(Math.floor(Math.random() * chars.length));
                    })
                    .join(''),
        },
        userId: { type: String, required: true },
        travelId: { type: String, required: true },
        visitngPlaces: { type: String },
        travelAgencyName: { type: String },
        country: { type: String },
        state: { type: String },
        city: { type: String },
        themes: { type: String },
        price: { type: Number },
        nights: { type: Number },
        days: { type: Number },
        from: { type: Date },
        to: { type: Date },
        amenities: [String],
        inclusion: [String],
        exclusion: [String],
        termsAndConditions: {
            type: Map,
            of: String,
        },
        dayWise: [
            {
                day: { type: Number },
                description: { type: String },
            },
        ],
    },
    { timestamps: true, strict: false }
);

const TourBooking = mongoose.model('TourBooking', tourBookingSchema);
module.exports = TourBooking;
