const TourBooking = require("../../models/tour/booking");
const TourModel = require("../../models/tour/tour");

exports.createBooking = async (req, res) => {
  try {
    const data = req.body;

    const seats = Array.isArray(data.seats) ? data.seats : [];
    if (!data.tourId || !data.vehicleId) {
      return res.status(400).json({ message: "tourId and vehicleId required" });
    }

    if (seats.length > 0) {
      const tour = await TourModel.findById(data.tourId).select("vehicles");
      if (!tour) return res.status(404).json({ message: "Tour not found" });

      const vehicle = tour.vehicles.find(v => String(v._id) === String(data.vehicleId));
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

      const bookedSet = new Set(vehicle.bookedSeats || []);
      const conflictSeats = seats.filter(seat => bookedSet.has(seat));

      if (conflictSeats.length > 0) {
        return res.status(409).json({
          message: "Some seats already booked",
          conflictSeats
        });
      }
    }

    const newBooking = await TourBooking.create(data);

    // Decrement seats in tour vehicle
    if (seats.length > 0) {
      await TourModel.updateOne(
        { _id: data.tourId, "vehicles._id": data.vehicleId },
        { $push: { "vehicles.$.bookedSeats": { $each: seats } } }
      );
    }

    return res.status(201).json(newBooking);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while creating the booking",
      error: error.message
    });
  }
};

exports.getVehicleSeats = async (req, res) => {
  const { tourId, vehicleId } = req.params;

  try {
    const tour = await TourModel.findById(tourId).select("vehicles");
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const vehicle = (tour.vehicles || []).find((v) => String(v._id) === String(vehicleId));
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const seatLayout = Array.isArray(vehicle.seatLayout) && vehicle.seatLayout.length > 0
      ? vehicle.seatLayout
      : Array.from({ length: Number(vehicle.totalSeats || 0) }, (_, i) => String(i + 1));

    const bookedSeats = vehicle.bookedSeats || [];
    const bookedSet = new Set(bookedSeats);

    const seats = seatLayout.map((code) => ({
      code,
      status: bookedSet.has(code) ? "booked" : "available"
    }));

    return res.status(200).json({
      tourId: String(tour._id),
      vehicleId: String(vehicle._id),
      seats
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch seats",
      error: error.message
    });
  }
};


exports.getBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find().sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching bookings",
      error: error.message,
    });
  }
};


exports.getByAgencyEmail = async (req, res) => {
  try {
    const { email } = req.params; 
    const bookings = await TourBooking.find({ agencyEmail: email }).sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching bookings",
      error: error.message,
    });
  }
};

exports.getBookingsByBookingId = async (req, res) => {
  const { bookingCode } = req.params;

  try {
    const booking = await TourBooking.findOne({ bookingCode });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching the booking",
      error: error.message,
    });
  }
};

exports.getBookingByUser = async (req, res) => {
  try {
    const { userId } = req.query;

    const bookings = await TourBooking.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while fetching user bookings",
      error: error.message,
    });
  }
};

exports.getTotalSell = async (req, res) => {
  try {
    const result = await TourBooking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalSell: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalSell = result.length > 0 ? result[0].totalSell : 0;
    return res.status(200).json({ totalSell });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateBooking = async (req, res) => {
  const { bookingCode } = req.params;
  const data = req.body;

  try {
    const booking = await TourBooking.findOneAndUpdate(
      { bookingCode },
      data,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If status changed to cancelled, free up seats
    if (booking.status === "cancelled" && booking.seats.length > 0) {
      await TourModel.updateOne(
        { _id: booking.tourId, "vehicles._id": booking.vehicleId },
        { $pullAll: { "vehicles.$.bookedSeats": booking.seats } }
      );
    }

    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteBooking = async (req, res) => {
  const { bookingCode } = req.params;

  try {
    const booking = await TourBooking.findOneAndDelete({ bookingCode });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Free up seats on deletion
    if (booking.seats.length > 0) {
      await TourModel.updateOne(
        { _id: booking.tourId, "vehicles._id": booking.vehicleId },
        { $pullAll: { "vehicles.$.bookedSeats": booking.seats } }
      );
    }

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

