const express = require('express');
const { bookCar, getTravelBookings, updateBooking, getOwnerByCarAndGetBookings, getBookingsOfOwner, getBookingBookedBy } = require('../../controllers/travel/booking');
const router = express.Router();

router.post("/create-travel/booking", bookCar);
router.get('/get-travels-bookings', getTravelBookings)
router.patch('/update-travel/booking',updateBooking)
router.get("/get-bookings-by/owner/:ownerId",getBookingsOfOwner)
router.get("/get-bookings-by/bookedBy",getBookingBookedBy);

module.exports = router;