const Tour = require("../../models/tour/tour");

function toTermsMap(termsAndConditions) {
  if (!termsAndConditions) return undefined;
  if (termsAndConditions instanceof Map) return termsAndConditions;
  if (typeof termsAndConditions === "string") {
    try {
      const parsed = JSON.parse(termsAndConditions);
      if (parsed && typeof parsed === "object") return new Map(Object.entries(parsed));
    } catch (_) {
      return undefined;
    }
  }
  if (typeof termsAndConditions === "object") return new Map(Object.entries(termsAndConditions));
  return undefined;
}

function normalizeVehicles(input) {
  if (!input) return undefined;
  let vehicles = input;

  if (typeof vehicles === "string") {
    try {
      vehicles = JSON.parse(vehicles);
    } catch (_) {
      return undefined;
    }
  }

  if (!Array.isArray(vehicles)) return undefined;

  return vehicles.map(v => ({
    _id: v._id,
    name: v.name,
    vehicleNumber: v.vehicleNumber,
    totalSeats: v.totalSeats,
    seatLayout: Array.isArray(v.seatLayout) ? v.seatLayout : [],
    pricePerSeat: v.pricePerSeat ?? 0,
    isActive: v.isActive ?? true,
  }));
}

exports.createTravel = async (req, res) => {
  try {
    const images = req.files ? req.files.map((file) => file.location) : [];
    const body = { ...req.body };

    const termsMap = toTermsMap(body.termsAndConditions);
    if (termsMap) body.termsAndConditions = termsMap;

    const vehicles = normalizeVehicles(body.vehicles);
    if (vehicles) body.vehicles = vehicles;

    const created = await Tour.create({ ...body, images });
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create travel" });
  }
};

exports.updateTour = async (req, res) => {
  const { id } = req.params;

  try {
    const body = { ...req.body };

    const termsMap = toTermsMap(body.termsAndConditions);
    if (termsMap) body.termsAndConditions = termsMap;

    const vehicles = normalizeVehicles(body.vehicles);
    if (vehicles) body.vehicles = vehicles;

    const updated = await Tour.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ success: false, message: "Tour not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update travel" });
  }
};

exports.changeTourImage = async (req, res) => {
  const { id } = req.params;

  try {
    const newImages = req.files ? req.files.map((file) => file.location) : [];

    const updated = await Tour.findByIdAndUpdate(
      id,
      { $push: { images: { $each: newImages } } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Tour not found" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update travel images" });
  }
};

exports.deleteTourImage = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;

  try {
    const tour = await Tour.findById(id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= (tour.images?.length || 0)) {
      return res.status(400).json({ message: "Invalid image index" });
    }

    const removed = tour.images[idx];
    tour.images.splice(idx, 1);
    await tour.save();

    return res.status(200).json({
      message: "Image deleted",
      removed,
      remaining: tour.images,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error while deleting image" });
  }
};

exports.sortByOrder = async (req, res) => {
  try {
    const { sort } = req.query;
    let sortOrder = 1;

    if (sort === "desc") sortOrder = -1;
    else if (sort !== "asc") {
      return res.status(400).json({ message: 'Invalid sort parameter. Use "asc" or "desc".' });
    }

    const travels = await Tour.find({ isAccepted: true }).sort({ price: sortOrder });
    return res.json(travels);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching travels", error: error.message });
  }
};

exports.sortByPrice = async (req, res) => {
  const { minPrice, maxPrice } = req.query;

  try {
    const query = { isAccepted: true };

    if (minPrice != null) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice != null) query.price = { ...query.price, $lte: Number(maxPrice) };

    const findData = await Tour.find(query);
    return res.json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sortByDuration = async (req, res) => {
  const { minNights, maxNights } = req.query;

  try {
    const query = { isAccepted: true };

    if (minNights != null) query.nights = { ...query.nights, $gte: Number(minNights) };
    if (maxNights != null) query.nights = { ...query.nights, $lte: Number(maxNights) };

    const findData = await Tour.find(query);
    return res.json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sortBythemes = async (req, res) => {
  try {
    const { themes } = req.query;
    const findData = await Tour.find({ themes, isAccepted: true });
    return res.json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourList = async (_, res) => {
  try {
    const findData = await Tour.find({ isAccepted: true }).sort({ createdAt: -1 });
    return res.status(200).json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const { id } = req.params;
    const findData = await Tour.findById(id);
    if (!findData) return res.status(404).json({ message: "Tour not found" });
    return res.status(200).json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTourByOwner = async (req, res) => {
  try {
    const { email } = req.query;
    const findData = await Tour.find({
      agencyEmail: { $regex: email, $options: "i" },
      isAccepted: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json(findData);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getByCity = async (req, res) => {
  const { city } = req.query;

  try {
    const query = city
      ? { city: { $regex: city, $options: "i" }, isAccepted: true }
      : { isAccepted: true };

    const results = await Tour.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve data" });
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const findAll = await Tour.find({ isAccepted: true }).select("city");
    const cities = [...new Set((findAll || []).map((t) => t.city).filter(Boolean))];

    if (cities.length === 0) return res.status(404).json({ message: "No cities found." });
    return res.status(200).json(cities);
  } catch (error) {
    return res.status(500).json({ message: "It seems there's an error!" });
  }
};

exports.getRequestedTour = async (req, res) => {
  try {
    const requestedTravels = await Tour.find({ isAccepted: false }).sort({ createdAt: -1 });
    return res.status(200).json(requestedTravels);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
