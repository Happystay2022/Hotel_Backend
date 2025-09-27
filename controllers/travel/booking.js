const TravelBooking = require("../../models/travel/travelBooking");
const carOwner = require("../../models/travel/carOwner");
const Car = require("../../models/travel/cars");
const { default: mongoose } = require("mongoose");
const { getGSTData } = require("../GST/gst");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");

exports.bookCar = async (req, res) => {
  try {
    const {
      seats,
      sharingType,
      vehicleType,
      carId,
      bookedBy,
      customerMobile,
      customerEmail,
    } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    let totalSeatPrice;
    let bookedSeatIds = [];

    if (sharingType === "Private") {
      if (!car.isAvailable) {
        return res
          .status(400)
          .json({ message: "Car is not available for private booking" });
      }
      totalSeatPrice = car.price;

      car.seatConfig.forEach((seat) => {
        seat.isBooked = true;
        seat.bookedBy = bookedBy;
        bookedSeatIds.push(seat._id);
      });

      car.isAvailable = false;
      car.runningStatus = "On A Trip";
    } else {
      // Shared booking
      if (!seats || !Array.isArray(seats) || seats.length === 0) {
        return res
          .status(400)
          .json({ message: "No seats selected for shared booking" });
      }

      const selectedSeats = [];
      for (const seatId of seats) {
        const seat = car.seatConfig.find((s) => s._id.toString() === seatId);
        if (!seat) {
          return res.status(404).json({ message: `Seat ${seatId} not found` });
        }
        if (seat.isBooked) {
          return res
            .status(400)
            .json({ message: `Seat ${seat.seatNumber || seatId} is already booked` });
        }

        seat.isBooked = true;
        seat.bookedBy = bookedBy;
        bookedSeatIds.push(seat._id);
        selectedSeats.push(seat);
      }

      totalSeatPrice = selectedSeats.reduce(
        (sum, seat) => sum + seat.seatPrice,
        0,
      );
    }

    const gstData = await getGSTData({
      type: "Travel",
      gstThreshold: totalSeatPrice,
    });

    const gstRate = gstData?.gstPrice || 0;
    const gstAmount = (totalSeatPrice * gstRate) / 100;
    const finalPrice = totalSeatPrice + gstAmount;

    await car.save();

    const newBooking = await TravelBooking.create({
      carId: car._id,
      seats: bookedSeatIds,
      bookedBy,
      price: finalPrice,
      gstPrice: gstRate,
      gstAmount,
      sharingType,
      vehicleType,
      customerMobile,
      customerEmail,
      pickupP: car.pickupP,
      dropP: car.dropP,
      pickupD: car.pickupD,
      dropD: car.dropD,
      vehicleNumber: car.vehicleNumber,
    });

    await sendCustomEmail({
      email: customerEmail,
      subject: `Your Travel Booking is Confirmed`,
      message: `Your booking (ID: ${newBooking.bookingId}) has been confirmed. Vehicle Number: ${car.vehicleNumber}.`,
      link: process.env.FRONTEND_URL,
    });

    return res.status(201).json({
      success: true,
      message: "Booking successful",
      data: newBooking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.getTravelBookings = async (req, res) => {
  try {
    const bookings = await TravelBooking.find();

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const car = await Car.findById(booking.carId).lean();

        let seatDetails = [];

        if (car && Array.isArray(car.seatConfig)) {
          seatDetails = car.seatConfig.filter((seat) =>
            booking.seats.includes(seat._id.toString()),
          );
        }

        // Calculate total price from seat prices
        const totalSeatPrice = seatDetails.reduce(
          (sum, seat) => sum + (seat.seatPrice || 0),
          0,
        );

        return {
          ...booking.toObject(),
          seats: seatDetails, // enriched seat info
          totalSeatPrice: totalSeatPrice, // added field
        };
      }),
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error in getTravelBookings:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.updateBooking = async function (req, res) {
  try {
    const { id, data } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Booking ID" });
    }

    // Find the booking document first
    const booking = await TravelBooking.findOne({ _id: id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update only fields that exist in `data`
    Object.keys(data).forEach((key) => {
      booking[key] = data[key];
    });

    // Save the updated document
    const updatedBooking = await booking.save();

    return res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update Booking Error:", error);
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getBookingsOfOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const ownerCars = await Car.find({ ownerId: ownerId });
    const carIds = ownerCars.map((car) => car._id);

    const bookings = await TravelBooking.find({ carId: { $in: carIds } });

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const car = await Car.findById(booking.carId).lean();

        if (!car || !Array.isArray(car.seatConfig)) {
          return {
            ...booking.toObject(),
            availableSeatsOnCar: [],
          };
        }

        const bookingObj = booking.toObject();

        // Match booked seat IDs with seat objects (including price)
        const fullSeatDetails = bookingObj.seats
          .map((seatId) =>
            car.seatConfig.find((seat) => String(seat._id) === String(seatId)),
          )
          .filter(Boolean);

        // Optional: Total price of booked seats
        const totalSeatPrice = fullSeatDetails.reduce((sum, seat) => {
          return sum + (seat?.seatPrice || 0);
        }, 0);

        return {
          ...bookingObj,
          availableSeatsOnCar: car.seatConfig,
          seats: fullSeatDetails, // full seat objects with price
          totalSeatPrice, // optional: sum of booked seat prices
        };
      }),
    );

    res.status(200).json(enrichedBookings);
    console.log("enrichedBookings", enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getBookingBookedBy = async (req, res) => {
  try {
    const { customerMobile } = req.body; // mobile no. from request

    // 1. Customer ke bookings laiye
    const bookings = await TravelBooking.find({ customerMobile });

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found" });
    }

    // 2. Sare booking ke carIds nikal lo
    const carIds = bookings.map((booking) => booking.carId);

    // 3. Cars find karo
    const cars = await Car.find({ _id: { $in: carIds } });

    // Car map banalo
    const carMap = {};
    cars.forEach((car) => {
      carMap[car._id.toString()] = car;
    });

    // 4. Har booking ke sath car details + filtered seat config add karo
    const enrichedBookings = bookings.map((booking) => {
      const car = carMap[booking.carId.toString()];
      let filteredSeats = [];

      if (car && Array.isArray(car.seatConfig)) {
        // sirf wahi seats dikhani jo booking.seats me hain
        filteredSeats = car.seatConfig.filter((seat) =>
          booking.seats.includes(seat._id.toString())
        );
      }

      return {
        ...booking.toObject(),
        carDetails: car
          ? {
              _id: car._id,
              name: car.name, // ya jo bhi fields chahiye car ki
              bookedSeats: filteredSeats, // sirf booked seats ka detail
            }
          : null,
      };
    });

    return res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



