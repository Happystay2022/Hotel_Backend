const bookingModel = require("../../models/booking/booking");
const hotelModel = require("../../models/hotel/basicDetails");
const userModel = require("../../models/user");
const { sendBookingConfirmationMail, sendThankYouForVisitMail, sendBookingCancellationMail } = require("../../nodemailer/nodemailer");
const { getGSTData } = require("../GST/gst");
//==========================================creating booking========================================================================================================
const createBooking = async (req, res) => {
  try {
    const { userId, hotelId } = req.params;
    let {
      checkInDate,
      checkOutDate,
      guests,
      guestDetails,
      numRooms,
      foodDetails,
      roomDetails,
      pm,
      isPartialBooking,
      partialAmount,
      bookingStatus,
      createdBy,
      couponCode,
      discountPrice,
      bookingSource,
      hotelName,
      hotelEmail,
      hotelCity,
      hotelOwnerName,
      destination,
    } = req.body;

    const user = await userModel.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const bookingId = [...Array(10)]
      .map(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
      })
      .join('');

    const nights = Math.max(
      1,
      Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))
    );

    // Calculate base room price
    let perRoomPrice = roomDetails?.[0]?.price || 0;
    const roomBaseTotal = perRoomPrice * numRooms * nights;
    
    // Apply discount first
    const discountAmount = discountPrice || 0;
    const discountedRoomTotal = Math.max(0, roomBaseTotal - discountAmount);
    
    // Calculate GST on discounted amount
    const gstData = await getGSTData({
      type: "Hotel",
      gstThreshold: [discountedRoomTotal / numRooms / nights], // Pass discounted per room price
    });

    const gstRate = gstData?.gstPrice || 0;
    const gstAmount = (discountedRoomTotal * gstRate) / 100;

    // Calculate food price
    const foodPrice = (foodDetails || []).reduce((sum, food) => {
      return sum + (food.price || 0) * (food.quantity || 1);
    }, 0);

    // Calculate final price
    const finalPrice = discountedRoomTotal + gstAmount + foodPrice;

    const booking = new bookingModel({
      bookingId,
      user: {
        userId: user.userId,
        profile: user.images,
        name: user.userName,
        email: user.email,
        mobile: user.mobile,
      },
      createdBy: createdBy
        ? {
          user: createdBy.user,
          email: createdBy.email,
        }
        : undefined,
      hotelDetails: {
        hotelCity,
        hotelId,
        hotelName,
        hotelEmail,
        hotelOwnerName,
        destination,
      },
      foodDetails,
      numRooms,
      gstPrice: gstRate,
      gstAmount,
      foodPrice,
      baseRoomPrice: roomBaseTotal,
      discountedRoomPrice: discountedRoomTotal, // Add this field for clarity
      checkInDate,
      checkOutDate,
      guests,
      guestDetails,
      price: finalPrice,
      couponCode,
      discountPrice: discountAmount,
      pm,
      isPartialBooking,
      partialAmount,
      bookingStatus,
      bookingSource,
      destination,
      roomDetails,
    });

    const savedBooking = await booking.save();

    await sendBookingConfirmationMail({
      email: booking?.user?.email,
      subject: "Booking Confirmation",
      bookingData: booking,
      link: process.env.FRONTEND_URL,
    });

    // Update room availability
    for (const bookedRoom of roomDetails) {
      const { roomId } = bookedRoom;
    
      const hotel = await hotelModel.findOne({
        hotelId: hotelId,
        "rooms.roomId": roomId,
      });
    
      const roomIndex = hotel?.rooms?.findIndex((r) => r.roomId === roomId);
    
      if (
        hotel &&
        roomIndex !== -1 &&
        hotel.rooms[roomIndex].countRooms > 0
      ) {
        await hotelModel.updateOne(
          { hotelId: hotelId, "rooms.roomId": roomId },
          { $inc: { "rooms.$.countRooms": -1 } }
        );
      }
    }

    res.status(201).json({ success: true, data: savedBooking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getBookingCounts = async function (req, res) {
  const getCount = await bookingModel.countDocuments({});
  res.json(getCount);
};

const getTotalSell = async function (req, res) {
  try {
    const result = await bookingModel.aggregate([
      {
        $group: {
          _id: null,
          totalSell: { $sum: "$price" },
        },
      },
    ]);

    const totalSell = result.length > 0 ? result[0].totalSell : 0;

    res.status(200).json({ totalSell });
  } catch (error) {
    console.error("Error getting total sell:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//========================================================================
const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const data = req.body;

  try {
    const updatedData = await bookingModel.findOneAndUpdate(
      { bookingId },
      { $set: data },
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (updatedData.bookingStatus === "Cancelled") {
      const roomId = updatedData?.roomDetails[0]?.roomId;

      const findHotel = await hotelModel.findOne({
        hotelId: updatedData.hotelDetails.hotelId,
      });

      if (findHotel) {
        const roomIndex = findHotel.rooms.findIndex(
          (room) => room.roomId === roomId
        );

        if (roomIndex !== -1) {
          findHotel.rooms[roomIndex].countRooms += 1;
          findHotel.markModified(`rooms.${roomIndex}.countRooms`);
          await findHotel.save();
        }
      }
    }

    if (updatedData.bookingStatus === "Checked-out") {
      await sendThankYouForVisitMail({
        email: updatedData?.user?.email,
        subject: "Thank you for visiting",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });
    }

    if (updatedData.bookingStatus === "Cancelled") {
      await sendBookingCancellationMail({
        email: updatedData?.user?.email,
        subject: "Booking Cancelled !",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });
    }
    if (updatedData.bookingStatus === "Confirmed") {
      await sendBookingConfirmationMail({
        email: updatedData?.user?.email,
        subject: "Booking Confirmed !",
        bookingData: updatedData,
        link: process.env.FRONTEND_URL,
      });
    }
    res.json(updatedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


//==========================================================getallBookingByID main site bookings list=======================
const getAllFilterBookings = async (req, res) => {
  try {
    const { bookingStatus, userId } = req.query;

    const bookings = await bookingModel
      .find({
        "user.userId": userId,
        bookingStatus,
      })
      .sort({ createdAt: -1 }); // ✅ Correct sort

    if (bookings.length === 0) {
      return res.status(400).json({
        message: `Seems you have no ${bookingStatus} bookings.`,
      });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error in getAllFilterBookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getAllFilterBookingsByQuery = async (req, res) => {
  try {
    const { bookingStatus, userId, bookingId, hotelEmail, date, hotelCity, couponCode, createdBy } = req.query;
    const filter = {};

    if (userId) {
      filter["user.userId"] = userId;
    }
    if (bookingStatus) {
      filter.bookingStatus = bookingStatus;
    }
    if (couponCode) {
      filter.couponCode = couponCode
    }
    if (createdBy) {
      filter["createdBy.email"] = createdBy;
    }

    if (hotelEmail) {
      filter["hotelDetails.hotelEmail"] = { $regex: hotelEmail, $options: "i" };

    }
    if (bookingId) {
      filter.bookingId = bookingId;
    }
    if (hotelCity) {
      filter["hotelDetails.hotelCity"] = { $regex: new RegExp(hotelCity.trim(), "i") };
    }

    if (date) {
      const queryDate = new Date(date);
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

      filter.$or = [
        { checkInDate: date },
        { checkOutDate: date },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      ];
    }

    const bookings = await bookingModel.find(filter).sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res.status(400).json({ message: "No bookings found" });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error in getAllFilterBookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createBooking,
  updateBooking,
  getAllFilterBookings,
  getBookingCounts,
  getTotalSell,
  getAllFilterBookingsByQuery,
};
