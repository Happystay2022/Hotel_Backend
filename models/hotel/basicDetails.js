const mongoose = require('mongoose');
const generateHotelId = () => {
    const min = 10000000; // Minimum 8-digit number
    const max = 99999999; // Maximum 8-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const hotelsSchema = new mongoose.Schema(
    {
        hotelId: {
            type: String,
            unique: true,
            default: generateHotelId,
        },
        images: {
            type: [String],
        },
        hotelName: {
            type: String,
        },
        description: String,
        hotelOwnerName: {
            type: String,
        },
        destination: {
            type: String,
        },
        onFront: {
            type: Boolean,
            default: false,
        },
        state: String,
        city: String,
        latitude: String,
        longitude: String,
        landmark: String,
        pinCode: Number,
        hotelCategory: String,
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        rating: {
            type: Number,
        },
        reviewCount: {
            type: Number,
        },
        starRating: {
            type: String,
            default: '2',
        },
        propertyType: [String],
        contact: {
            type: Number,
        },
        isAccepted: {
            type: Boolean,
            default: false,
        },
        rooms: {
            type: [{}],
            ref: 'rooms',
        },

        foods: {
            type: [{}],
            ref: 'foods',
        },

        amenities: {
            type: [{}],
            ref: 'amenities',
        },

        policies: {
            type: [{}],
            ref: 'policies',
        },
        localId: {
            type: String,
            enum: ['Accepted', 'Not Accepted'],
            default: 'Accepted',
        },
        hotelEmail: String,
        generalManagerContact: String,
        salesManagerContact: String,
        customerWelcomeNote: String,
    },

    { timestamps: true }
);

module.exports = mongoose.model('hotels', hotelsSchema);
