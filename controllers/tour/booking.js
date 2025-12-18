const TourBooking = require("../../models/tour/booking");

exports.createBooking = async (req, res) => {
  try {
    const data = req.body;

    const newBooking = await TourBooking.create(data);
    return res.status(201).json(newBooking);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while creating the booking",
      error: error.message,
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

    return res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
