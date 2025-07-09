const hotelModel = require('../../models/hotel/basicDetails');
const month = require('../../models/booking/monthly');
const cron = require('node-cron');
const { DateTime } = require('luxon'); // Add this line at the top

const bookingsModel = require('../../models/booking/booking');
const monthly = require('../../models/booking/monthly');
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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//=================================Count of hotel=============================
const getCount = async function (req, res) {
    try {
        const count = await hotelModel.countDocuments({ isAccepted: true });
        res.json(count);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//==========================================================================

const getCountPendingHotels = async function (req, res) {
    try {
        const count = await hotelModel.countDocuments({ isAccepted: false });
        console.log('Count of pending hotels:', count);
        res.status(200).json({ count });
    } catch (error) {
        console.error('Error while getting count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
//=================================update hotel images=================
const updateHotelImage = async (req, res) => {
    try {
        const { hotelId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files were uploaded' });
        }

        // Extract image locations
        const images = req.files.map((file) => file.location);

        // Check if the hotel exists
        const updatedHotel = await hotelModel.findById(hotelId);
        if (!updatedHotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Update images
        updatedHotel.images = [...updatedHotel.images, ...images]; // Append new images
        await updatedHotel.save();

        res.status(200).json({
            message: 'Hotel images updated successfully',
            data: updatedHotel,
        });
    } catch (error) {
        console.error('Error updating hotel images:', error);
        res.status(500).json({ message: 'An error occurred while updating hotel images' });
    }
};

//======================================Delete hotel images=======================
const deleteHotelImages = async function (req, res) {
    const { hotelId } = req.params;
    const { imageUrl } = req.query;

    if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required' });
    }

    try {
        // Find the hotel by ID
        const hotel = await hotelModel.findOne({ hotelId });

        if (!hotel) {
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Check if the image URL exists in the array
        if (!hotel.images.includes(imageUrl)) {
            return res.status(404).json({ message: 'Image URL not found in the images array' });
        }

        // Remove the image URL from the array
        hotel.images = hotel.images.filter((image) => image !== imageUrl);

        // Save the updated hotel document
        await hotel.save();

        res.status(200).json({ message: 'Image URL deleted successfully', hotel });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
//==================================UpdateHotel================================
const UpdateHotelStatus = async function (req, res) {
    const { hotelId } = req.params;
    const { isAccepted, onFront } = req.body;

    try {
        const updateDetails = await hotelModel.findOneAndUpdate(
            { hotelId: hotelId }, // Use hotelId for querying
            { $set: { isAccepted: isAccepted, onFront: onFront } }, // Update fields
            { new: true } // To return the updated document
        );

        res.json(updateDetails);
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).json({ error: 'Failed to update hotel details.' });
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
            { new: true } // To return the updated document
        );

        res.json(updateDetails);
    } catch (error) {
        console.error('Error updating hotel:', error);
        res.status(500).json({ error: 'Failed to update hotel details.' });
    }
};

//=============================get hotel by amenities===========================//
const getByQuery = async (req, res) => {
    const { amenities, bedTypes, starRating, propertyType, hotelOwnerName, hotelEmail, roomTypes } = req.query;

    // Check if there are no query parameters
    if (!amenities && !bedTypes && !starRating && !propertyType && !hotelOwnerName && !hotelEmail && !roomTypes) {
        // Fetch all data where isAccepted is true
        const allData = await hotelModel.find({ isAccepted: true });
        res.json(allData);
        return;
    }

    const queryParameters = [
        { key: 'amenities', value: amenities },
        { key: 'roomDetails.bedTypes', value: bedTypes },
        { key: 'starRating', value: starRating },
        { key: 'propertyType', value: propertyType },
        { key: 'hotelOwnerName', value: hotelOwnerName },
        { key: 'hotelEmail', value: hotelEmail },
        { key: 'roomDetails.type', value: roomTypes },
    ];

    let fetchedData = [];

    for (const param of queryParameters) {
        if (param.value) {
            const query = {};

            if (param.key.includes('roomDetails')) {
                const elemMatchQuery = {};
                if (param.key.endsWith('countRooms')) {
                    // Check countRooms greater than 0
                    elemMatchQuery[param.key.split('.')[1]] = { $gt: 0 };
                } else {
                    elemMatchQuery[param.key.split('.')[1]] = Array.isArray(param.value)
                        ? { $in: param.value.map((val) => new RegExp(val, 'i')) }
                        : new RegExp(param.value, 'i');
                }

                query['roomDetails'] = { $elemMatch: elemMatchQuery };
            } else {
                query[param.key] = Array.isArray(param.value)
                    ? { $in: param.value.map((val) => new RegExp(val, 'i')) }
                    : new RegExp(param.value, 'i');
            }

            // Add check for isAccepted
            query['isAccepted'] = true;

            fetchedData = await hotelModel.find(query);

            if (fetchedData.length > 0) {
                break; // Exit the loop if data is found
            }
        }
    }

    res.json(fetchedData);
};

//================================================================================================

const getAllHotels = async (req, res) => {
    try {
        const getData = await hotelModel.find().sort({ isAccepted: 1 });

        res.json({ success: true, data: getData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//===========================get hotels====================================================//
const getHotels = async (req, res) => {
    const hotels = await hotelModel.find().sort({ createdAt: -1 });
    const filterData = hotels.filter((hotel) => hotel.onFront === false);
    res.json(filterData);
};
//======================================get offers==========================================//
const setOnFront = async (req, res) => {
    try {
        const hotels = await hotelModel.find().sort({ createdAt: -1 });
        const filterData = hotels.filter((hotel) => hotel.onFront === true);
        const monthlyData = await monthly.find();

        // Get the current date in YYYY-MM-DD format (IST)
        const currentDate = new Date();
        const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
        const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
        const formattedCurrentDate = currentDateIST.toISOString().split('T')[0];

        // Update room prices based on monthly data
        filterData.forEach((hotel) => {
            hotel.rooms.forEach((room) => {
                const matchingMonthlyEntry = monthlyData.find((data) => {
                    const startDate = new Date(data.startDate);
                    const endDate = new Date(data.endDate);

                    return (
                        data.hotelId === hotel.hotelId.toString() && // Ensure matching hotel ID
                        data.roomId === room.roomId && // Ensure matching room ID
                        formattedCurrentDate >= startDate.toISOString().split('T')[0] && // Current date is after or equal to startDate
                        formattedCurrentDate <= endDate.toISOString().split('T')[0] // Current date is before or equal to endDate
                    );
                });

                // If there's a matching monthly entry, update the room price
                if (matchingMonthlyEntry) {
                    room.price = matchingMonthlyEntry.monthPrice;
                }
            });
        });

        res.json(filterData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

//============================get by city============================================//
const getCity = async function (req, res) {
    const { city } = req.query;
    const searchQuery = {};

    if (city) {
        searchQuery.city = { $regex: new RegExp(city, 'i') };
    }

    const hotels = await hotelModel.find(searchQuery).sort({ createdAt: -1 });

    res.json(hotels);
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
    res.status(200).json({ message: 'deleted' });
};
//===========================================================
const getHotelsByLocalID = async (req, res) => {
    const { localId } = req.params;

    try {
        const hotels = await hotelModel.find({ 'location.localId': localId }).sort({ createdAt: -1 });
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hotels' });
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
        } = req.query;

        let filters = {};

        // Combined search input
        if (search) {
            const searchPattern = new RegExp(search, 'i');
            filters.$or = [
                { city: { $regex: searchPattern } },
                { state: { $regex: searchPattern } },
                { landmark: { $regex: searchPattern } },
                { hotelName: { $regex: searchPattern } },
            ];
        }

        if (starRating) filters.starRating = starRating;
        if (propertyType) filters.propertyType = { $regex: new RegExp(propertyType, 'i') };
        if (localId) filters.localId = localId;
        if (hotelCategory) filters.hotelCategory = { $regex: new RegExp(hotelCategory, 'i') };
        if (latitude) filters.latitude = latitude;
        if (longitude) filters.longitude = longitude;
        if (countRooms) filters['rooms.countRooms'] = { $gte: parseInt(countRooms) };
        if (type) filters['rooms.type'] = { $regex: new RegExp(type, 'i') };
        if (bedTypes) filters['rooms.bedTypes'] = { $regex: new RegExp(bedTypes, 'i') };
        if (amenities) filters['amenities.amenities'] = { $in: amenities.split(',') };
        if (unmarriedCouplesAllowed) filters['policies.unmarriedCouplesAllowed'] = unmarriedCouplesAllowed;

        // Add minPrice and maxPrice filtering
        if (minPrice || maxPrice) {
            let priceFilter = {};
            if (minPrice) priceFilter.$gte = parseFloat(minPrice);
            if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
            filters['rooms.price'] = priceFilter;
        }

        // Fetch hotels that match all filters
        const hotels = await hotelModel.find(filters);
        const acceptedHotels = hotels.filter((hotel) => hotel.isAccepted);

        // If checkInDate and checkOutDate are provided, check availability
        if (checkInDate && checkOutDate) {
            const availableHotels = [];

            for (const hotel of acceptedHotels) {
                // Check availability for this hotel
                const { availableRooms } = await checkAvailability({ hotelId: hotel.hotelId, checkInDate, checkOutDate });

                // If available rooms are present, add to the list
                if (availableRooms > 0) {
                    availableHotels.push(hotel);
                }
            }

            return res.status(200).json({ success: true, data: availableHotels });
        }

        // Get monthly data
        const monthlyData = await monthly.find();

        // Get current date in YYYY-MM-DD format (IST)
        const currentDate = new Date();
        const IST_OFFSET = 5.5 * 60 * 60 * 1000; // UTC+5:30
        const currentDateIST = new Date(currentDate.getTime() + IST_OFFSET);
        const formattedCurrentDate = currentDateIST.toISOString().split('T')[0];

        // Update room prices based on monthly data
        acceptedHotels.forEach((hotel) => {
            hotel.rooms.forEach((room) => {
                const matchingMonthlyEntry = monthlyData.find((data) => {
                    const startDate = new Date(data.startDate);
                    const endDate = new Date(data.endDate);

                    return (
                        data.hotelId === hotel.hotelId.toString() &&
                        data.roomId === room.roomId &&
                        formattedCurrentDate >= data.startDate &&
                        formattedCurrentDate <= data.endDate
                    );
                });

                // If there's a matching monthly entry, update the room price
                if (matchingMonthlyEntry) {
                    room.price = matchingMonthlyEntry.monthPrice;
                }
            });
        });

        res.status(200).json({ success: true, data: acceptedHotels });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
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
    const availableRooms = hotel.rooms.reduce((total, room) => total + room.countRooms, 0) - bookedRooms;

    return { availableRooms };
}

const getHotelsState = async function (req, res) {
    try {
        const getState = await hotelModel.find();

        // Use Set to keep track of unique state names
        const uniqueStatesSet = new Set();

        const finalData = getState.reduce((acc, stateData) => {
            const stateName = stateData.state;

            // Check if the state name is not already in the Set
            if (!uniqueStatesSet.has(stateName)) {
                // Add state name to the Set
                uniqueStatesSet.add(stateName);

                // Add the state data to the result array
                acc.push(stateName);
            }

            return acc;
        }, []);

        res.json(finalData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getHotelsCityByState = async function (req, res) {
    try {
        const { state } = req.query;

        if (!state) {
            return res.status(400).json({ error: 'State parameter is missing' });
        }

        const hotelsInState = await hotelModel.find({ state });

        // Use Set to keep track of unique city names
        const uniqueCitiesSet = new Set();

        // Extracting only the 'city' field from each document and filtering out duplicates
        const cityData = hotelsInState.reduce((acc, hotel) => {
            const cityName = hotel.city;

            // Check if the city name is not already in the Set
            if (!uniqueCitiesSet.has(cityName)) {
                // Add city name to the Set
                uniqueCitiesSet.add(cityName);

                // Add the city name to the result array
                acc.push(cityName);
            }

            return acc;
        }, []);

        res.json(cityData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getHotelsCity = async (req,res)=>{
    const fetchCity = await hotelModel.find()
    const finalData = fetchCity.filter((city)=>city.isAccepted ===true)
    const uniqueCities = new Set();
    finalData.forEach((hotel) => {
        if (hotel.city) {
            uniqueCities.add(hotel.city);
        }
    });
    const cityArray = Array.from(uniqueCities);
    res.status(200).json(cityArray);
}
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
                            return res.status(400).json({ error: 'Date not matched.' });
                        }
                    }
                }
            }
        }

        res.status(200).json({ message: 'Monthly prices updated successfully.' });
    } catch (error) {
        console.error('Error in monthlyPrice:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

cron.schedule('0 0 1 * *', async () => {
    await monthlyPrice();
});
// The first 0 represents the minute (00).
// The second 0 represents the hour (00).
// The 1 in the third position represents the day of the month (1st).
// The * in the fourth and fifth positions represents any month and any day of the week.
//=========================================list of applied coupons hotel==========================
const getCouponsAppliedHotels = async (req, res) => {
    try {
      // Find hotels where at least one room has isOffer: true
      const hotelsWithOfferRooms = await hotelModel.find({
        "rooms.isOffer": true
      });
  
      res.status(200).json(hotelsWithOfferRooms);
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
    getCouponsAppliedHotels,
    getCountPendingHotels,
    updateHotelImage,
    deleteHotelImages,
};
