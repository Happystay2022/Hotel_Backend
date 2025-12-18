const hotelModel = require("../../models/hotel/basicDetails");
const month = require("../../models/booking/monthly");
const cron = require("node-cron");
const { DateTime } = require("luxon"); // Add this line at the top

const bookingsModel = require("../../models/booking/booking");
const monthly = require("../../models/booking/monthly");
const { sendCustomEmail } = require("../../nodemailer/nodemailer");
const createHotel = async (req, res) => {
  try {
    const {
      hotelName,
      description,
      hotelOwnerName,
      destination,
      onFront,
      startDate,
      endDate,
      state,
      city,
      landmark,
      pinCode,
      hotelCategory,
      numRooms,
      latitude,
      longitude,
      reviews,
      rating,
      starRating,
      propertyType,
      contact,
      isAccepted,
      salesManagerContact,
      localId,
      hotelEmail,
      customerWelcomeNote,
      generalManagerContact,
    } = req.body;

    const images = req.files.map((file) => file.location);

    const hotelData = {
      hotelName,
      description,
      hotelOwnerName,
      destination,
      onFront,
      customerWelcomeNote,
      startDate,
      endDate,
      state,
      latitude,
      longitude,
      city,
      landmark,
      pinCode,
      hotelCategory,
      numRooms,
      reviews,
      rating,
      starRating,
      propertyType,
      contact,
      isAccepted,
      localId,
      hotelEmail,
      generalManagerContact,
      salesManagerContact,
      images,
    };

    const savedHotel = await hotelModel.create(hotelData);

    return res.status(201).json({
      message: `Your request is accepted. Kindly note your hotel id (${savedHotel.hotelId}) for future purposes.`,
      status: true,
      data: savedHotel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updatePolicies = async (req, res) => {
  const { hotelId } = req.params;
  const { policies } = req.body;

  if (!policies || !Array.isArray(policies)) {
    return res.status(400).json({ message: 'Policies must be provided as an array' });
  }

  try {
    const updatedHotel = await hotelModel.findOneAndUpdate(
      { hotelId },
      { $set: { policies } },
      { new: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    return res.json({ message: 'Policies updated successfully', policies: updatedHotel.policies });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
//=================================Count of hotel=============================
const getCount = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: true });
    res.json(count);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//==========================================================================

const getCountPendingHotels = async function (req, res) {
  try {
    const count = await hotelModel.countDocuments({ isAccepted: false });
    console.log("Count of pending hotels:", count);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error while getting count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================update hotel images=================
const updateHotelImage = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    // Extract image locations
    const images = req.files.map((file) => file.location);

    // Check if the hotel exists
    const updatedHotel = await hotelModel.findById(hotelId);
    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Update images
    updatedHotel.images = [...updatedHotel.images, ...images]; // Append new images
    await updatedHotel.save();

    res.status(200).json({
      message: "Hotel images updated successfully",
      data: updatedHotel,
    });
  } catch (error) {
    console.error("Error updating hotel images:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating hotel images" });
  }
};

//======================================Delete hotel images=======================
const deleteHotelImages = async function (req, res) {
  const { hotelId } = req.params;
  let { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  try {
    // Use $pull to remove the image URL from the images array
    const hotel = await hotelModel.findOneAndUpdate(
      { hotelId: hotelId },
      { $pull: { images: imageUrl } },
      { new: true }
    );

    if (!hotel) {
      return res
        .status(404)
        .json({ message: "Hotel not found" });
    }

    res.status(200).json({
      message: "Image URL deleted successfully",
      hotel
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//==================================UpdateHotel================================
const UpdateHotelStatus = async function (req, res) {
  const { hotelId } = req.params;
  const { isAccepted, onFront } = req.body;

  try {
    const updateDetails = await hotelModel.findOneAndUpdate(
      { hotelId }, // Same as hotelId: hotelId
      {
        $set: {
          isAccepted: isAccepted,
          onFront: onFront,
        },
      },
      { new: true },
    );

    if (!updateDetails) {
      return res.status(404).json({ error: "Hotel not found." });
    }

    // Send notification email
    await sendCustomEmail({
      email: updateDetails.hotelEmail,
      subject: "Hotel Approval Confirmation",
      message: `Your hotel with ID ${updateDetails.hotelId} has been ${
        isAccepted ? "approved" : "rejected"
      }.`,
      link: process.env.FRONTEND_URL,
    });

    res.json({ success: true, data: updateDetails });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Failed to update hotel details." });
  }
};

//================================update hotel info =================================================
const UpdateHotelInfo = async function (req, res) {
  const { hotelId } = req.params;
  const {
    isAccepted,
    onFront,
    hotelName,
    hotelOwnerName,
    hotelEmail,
    localId,
    description,
    customerWelcomeNote,
    generalManagerContact,
    salesManagerContact,
    landmark,
    pinCode,
    hotelCategory,
    propertyType,
    starRating,
    city,
    state,
  } = req.body;

  try {
    const updateDetails = await hotelModel.findOneAndUpdate(
      { hotelId: hotelId }, // Use hotelId for querying
      {
        $set: {
          isAccepted: isAccepted,
          onFront: onFront,
          hotelName: hotelName,
          hotelOwnerName: hotelOwnerName,
          hotelEmail: hotelEmail,
          generalManagerContact: generalManagerContact,
          salesManagerContact: salesManagerContact,
          landmark: landmark,
          pinCode: pinCode,
          hotelCategory: hotelCategory,
          propertyType: propertyType,
          starRating: starRating,
          city: city,
          state: state,
          localId: localId,
          description: description,
          customerWelcomeNote: customerWelcomeNote,
        },
      }, // Update fields
      { new: true }, // To return the updated document
    );

    res.json(updateDetails);
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Failed to update hotel details." });
  }
};

//=============================get hotel by amenities===========================//
const getByQuery = async (req, res) => {
  const {
    amenities,
    bedTypes,
    starRating,
    propertyType,
    hotelOwnerName,
    hotelEmail,
    roomTypes,
  } = req.query;

  // Check if there are no query parameters
  if (
    !amenities &&
    !bedTypes &&
    !starRating &&
    !propertyType &&
    !hotelOwnerName &&
    !hotelEmail &&
    !roomTypes
  ) {
    // Fetch all data where isAccepted is true using cursor stream
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ isAccepted: true }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    return res.end();
  }

  const queryParameters = [
    { key: "amenities", value: amenities },
    { key: "roomDetails.bedTypes", value: bedTypes },
    { key: "starRating", value: starRating },
    { key: "propertyType", value: propertyType },
    { key: "hotelOwnerName", value: hotelOwnerName },
    { key: "hotelEmail", value: hotelEmail },
    { key: "roomDetails.type", value: roomTypes },
  ];

  let fetchedData = [];

  for (const param of queryParameters) {
    if (param.value) {
      const query = {};

      if (param.key.includes("roomDetails")) {
        const elemMatchQuery = {};
        if (param.key.endsWith("countRooms")) {
          // Check countRooms greater than 0
          elemMatchQuery[param.key.split(".")[1]] = { $gt: 0 };
        } else {
          elemMatchQuery[param.key.split(".")[1]] = Array.isArray(param.value)
            ? { $in: param.value.map((val) => new RegExp(val, "i")) }
            : new RegExp(param.value, "i");
        }

        query["roomDetails"] = { $elemMatch: elemMatchQuery };
      } else {
        query[param.key] = Array.isArray(param.value)
          ? { $in: param.value.map((val) => new RegExp(val, "i")) }
          : new RegExp(param.value, "i");
      }

      // Add check for isAccepted
      query["isAccepted"] = true;

      // Use cursor for streaming
      res.setHeader('Content-Type', 'application/json');
      res.write('[');
      let first = true;
      const cursor = hotelModel.find(query).cursor();
      for await (const hotel of cursor) {
        if (!first) res.write(',');
        res.write(JSON.stringify(hotel));
        first = false;
        fetchedData.push(hotel);
      }
      res.write(']');
      return res.end();
    }
  }

  res.json(fetchedData);
};

//================================================================================================

const getAllHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('{"success":true,"data":[');
    let first = true;
    const cursor = hotelModel.find().sort({ isAccepted: 1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']}');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

//===========================get hotels====================================================//
const getHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ onFront: false }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//======================================get offers==========================================//
const setOnFront = async (req, res) => {
  try {
    const monthlyData = await monthly.find().lean();

    // Get the current date in YYYY-MM-DD format (IST)
    const currentDate = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
    const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
    const formattedCurrentDate = currentDateIST.toISOString().split("T")[0];

    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    const cursor = hotelModel.find({ onFront: true }).sort({ createdAt: -1 }).cursor();
    
    for await (const hotel of cursor) {
      // Update room prices based on monthly data
      hotel.rooms.forEach((room) => {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          const startDate = new Date(data.startDate);
          const endDate = new Date(data.endDate);

          return (
            data.hotelId === hotel.hotelId.toString() &&
            data.roomId === room.roomId &&
            formattedCurrentDate >= startDate.toISOString().split("T")[0] &&
            formattedCurrentDate <= endDate.toISOString().split("T")[0]
          );
        });

        if (matchingMonthlyEntry) {
          room.price = matchingMonthlyEntry.monthPrice;
        }
      });

      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

//============================get by city============================================//
const getCity = async function (req, res) {
  const { city } = req.query;
  const searchQuery = {};

  if (city) {
    searchQuery.city = { $regex: new RegExp(city, "i") };
  }

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find(searchQuery).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//=================================================================================

const getHotelsById = async (req, res) => {
  try {
    const hotelId = req.params.hotelId;

    // Assuming you have the necessary models imported
    const hotel = await hotelModel.findOne({ hotelId });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//==================================================================================
const deleteHotelById = async function (req, res) {
  const { hotelId } = req.params;
  const deletedData = await hotelModel.findOneAndDelete({ hotelId: hotelId });
  res.status(200).json({ message: "deleted" });
};
//===========================================================
const getHotelsByLocalID = async (req, res) => {
  const { localId } = req.params;

  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    const cursor = hotelModel.find({ "location.localId": localId }).sort({ createdAt: -1 }).cursor();
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    res.write(']');
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
};

//============================================hotels by filter city,state,landmark=================================================
const getHotelsByFilters = async (req, res) => {
  try {
    const {
      search,
      starRating,
      propertyType,
      localId,
      latitude,
      longitude,
      countRooms,
      hotelCategory,
      type,
      bedTypes,
      amenities,
      unmarriedCouplesAllowed,
      minPrice,
      maxPrice,
      checkInDate,
      checkOutDate,
      page,
      limit,
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filters = {};

    // If no query filters are provided at all, return an empty array instead of fetching all hotels
    const hasAnyFilter = [
      search,
      starRating,
      propertyType,
      localId,
      latitude,
      longitude,
      countRooms,
      hotelCategory,
      type,
      bedTypes,
      amenities,
      unmarriedCouplesAllowed,
      minPrice,
      maxPrice,
      checkInDate,
      checkOutDate,
    ].some((v) => v !== undefined && v !== null && String(v).trim() !== "");

    if (!hasAnyFilter) {
      // No filters supplied — return empty result set
      return res.status(200).json({ success: true, data: [] });
    }

    // Combined search input
    if (search) {
      const searchPattern = new RegExp(search, "i");
      filters.$or = [
        { city: { $regex: searchPattern } },
        { state: { $regex: searchPattern } },
        { landmark: { $regex: searchPattern } },
        { hotelName: { $regex: searchPattern } },
      ];
    }

    if (starRating) filters.starRating = starRating;
    if (propertyType)
      filters.propertyType = { $regex: new RegExp(propertyType, "i") };
    if (localId) filters.localId = localId;
    if (hotelCategory)
      filters.hotelCategory = { $regex: new RegExp(hotelCategory, "i") };
    if (latitude) filters.latitude = latitude;
    if (longitude) filters.longitude = longitude;
    if (countRooms)
      filters["rooms.countRooms"] = { $gte: parseInt(countRooms) };
    if (type) filters["rooms.type"] = { $regex: new RegExp(type, "i") };
    if (bedTypes)
      filters["rooms.bedTypes"] = { $regex: new RegExp(bedTypes, "i") };
    if (amenities)
      filters["amenities.amenities"] = { $in: amenities.split(",") };
    if (unmarriedCouplesAllowed)
      filters["policies.unmarriedCouplesAllowed"] = unmarriedCouplesAllowed;

    // Add minPrice and maxPrice filtering
    if (minPrice || maxPrice) {
      let priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      filters["rooms.price"] = priceFilter;
    }

    // Add isAccepted filter directly in query
    filters.isAccepted = true;

    // Get monthly data
    const monthlyData = await monthly.find().lean();

    // If checkInDate and checkOutDate are provided, check availability
    if (checkInDate && checkOutDate) {
      // Fetch all bookings for the date range in ONE query
      const allBookings = await bookingsModel.find({
        $or: [
          {
            checkInDate: { $lte: new Date(checkOutDate) },
            checkOutDate: { $gte: new Date(checkInDate) }
          }
        ]
      }).select('hotelId numRooms').lean();

      // Create a map of hotelId -> total booked rooms
      const bookedRoomsMap = {};
      allBookings.forEach(booking => {
        if (!bookedRoomsMap[booking.hotelId]) {
          bookedRoomsMap[booking.hotelId] = 0;
        }
        bookedRoomsMap[booking.hotelId] += booking.numRooms;
      });

      const availableHotels = [];
      let count = 0;
      const cursor = hotelModel.find(filters).cursor();
      
      for await (const hotel of cursor) {
        const totalRooms = hotel.rooms.reduce((total, room) => total + (room.countRooms || 0), 0);
        const bookedRooms = bookedRoomsMap[hotel.hotelId] || 0;
        const availableRooms = totalRooms - bookedRooms;

        if (availableRooms > 0) {
          // Update room prices based on monthly data
          hotel.rooms.forEach((room) => {
            const matchingMonthlyEntry = monthlyData.find((data) => {
              return (
                data.hotelId === hotel.hotelId.toString() &&
                data.roomId === room.roomId &&
                data.startDate <= new Date() &&
                data.endDate >= new Date()
              );
            });

            if (matchingMonthlyEntry) {
              room.price = matchingMonthlyEntry.monthPrice;
            }
          });

          // Apply pagination
          if (count >= skip && availableHotels.length < parseInt(limit)) {
            availableHotels.push(hotel);
          }
          count++;
          
          // Stop if we've collected enough results
          if (availableHotels.length >= parseInt(limit)) {
            break;
          }
        }
      }

      return res.status(200).json({ 
        success: true, 
        data: availableHotels,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }

    // Get current date in YYYY-MM-DD format (IST)
    const currentDate = new Date();
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
    const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
    const formattedCurrentDate = currentDateIST.toISOString().split("T")[0];

    // Count total documents for pagination
    const total = await hotelModel.countDocuments(filters);

    // Apply pagination with skip and limit
    const hotels = await hotelModel.find(filters)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Update room prices based on monthly data
    hotels.forEach((hotel) => {
      hotel.rooms.forEach((room) => {
        const matchingMonthlyEntry = monthlyData.find((data) => {
          return (
            data.hotelId === hotel.hotelId.toString() &&
            data.roomId === room.roomId &&
            formattedCurrentDate >= data.startDate &&
            formattedCurrentDate <= data.endDate
          );
        });

        if (matchingMonthlyEntry) {
          room.price = matchingMonthlyEntry.monthPrice;
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      data: hotels,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// Sample checkAvailability function
async function checkAvailability({ hotelId, checkInDate, checkOutDate }) {
  const bookings = await bookingsModel.find({ hotelId });

  let bookedRooms = 0;

  for (const booking of bookings) {
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    // Skip bookings that don't overlap with the requested dates
    if (checkOut < new Date(checkInDate) || checkIn > new Date(checkOutDate)) {
      continue;
    }

    bookedRooms += booking.numRooms; // Count booked rooms
  }

  const hotel = await hotelModel.findOne({ hotelId });
  const availableRooms =
    hotel.rooms.reduce((total, room) => total + room.countRooms, 0) -
    bookedRooms;

  return { availableRooms };
}

const getHotelsState = async function (req, res) {
  try {
    const uniqueStatesSet = new Set();
    const cursor = hotelModel.find().select('state').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.state) {
        uniqueStatesSet.add(hotel.state);
      }
    }

    res.json(Array.from(uniqueStatesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCityByState = async function (req, res) {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({ error: "State parameter is missing" });
    }

    const uniqueCitiesSet = new Set();
    const cursor = hotelModel.find({ state }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCitiesSet.add(hotel.city);
      }
    }

    res.json(Array.from(uniqueCitiesSet));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getHotelsCity = async (req, res) => {
  try {
    const uniqueCities = new Set();
    const cursor = hotelModel.find({ isAccepted: true }).select('city').cursor();
    
    for await (const hotel of cursor) {
      if (hotel.city) {
        uniqueCities.add(hotel.city);
      }
    }
    
    res.status(200).json(Array.from(uniqueCities));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//=================================Update price monthly============================================
const monthlyPrice = async function (req, res) {
  try {
    const rooms = await month.find();
    const currentDate = new Date();
    const hotels = await hotelModel.find();

    for (const room of rooms) {
      for (const hotel of hotels) {
        for (const roomDetails of hotel.roomDetails) {
          if (String(room.roomId) === String(roomDetails._id)) {
            const roomDate = room.monthDate;

            if (roomDate <= currentDate) {
              roomDetails.price += room.monthPrice;
              await hotel.save();
            } else {
              return res.status(400).json({ error: "Date not matched." });
            }
          }
        }
      }
    }

    res.status(200).json({ message: "Monthly prices updated successfully." });
  } catch (error) {
    console.error("Error in monthlyPrice:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

cron.schedule("0 0 1 * *", async () => {
  await monthlyPrice();
});
// The first 0 represents the minute (00).
// The second 0 represents the hour (00).
// The 1 in the third position represents the day of the month (1st).
// The * in the fourth and fifth positions represents any month and any day of the week.
//=========================================list of applied coupons hotel==========================
const getCouponsAppliedHotels = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.write('[');
    let first = true;
    
    const cursor = hotelModel.find({ "rooms.isOffer": true }).cursor();
    
    for await (const hotel of cursor) {
      if (!first) res.write(',');
      res.write(JSON.stringify(hotel));
      first = false;
    }
    
    res.write(']');
    res.end();
  } catch (error) {
    console.error("Error fetching hotels with offers:", error);
    res.status(500).json({ message: "Error fetching hotels", error });
  }
};

//================================================================================================
module.exports = {
  createHotel,
  getAllHotels,
  getHotelsById,
  getHotelsByLocalID,
  getHotelsByFilters,
  getCity,
  getByQuery,
  UpdateHotelStatus,
  getHotels,
  setOnFront,
  deleteHotelById,
  UpdateHotelInfo,
  getHotelsState,
  getHotelsCity,
  getHotelsCityByState,
  monthlyPrice,
  getCount,
  updatePolicies,
  getCouponsAppliedHotels,
  getCountPendingHotels,
  updateHotelImage,
  deleteHotelImages,
};
