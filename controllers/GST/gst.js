const GST = require("../../models/GST/gst");

exports.createGST = async (req, res) => {
  const { gstPrice, gstMinThreshold, gstMaxThreshold, type } = req.body;

  try {
    const gst = new GST({
      gstPrice,
      gstMinThreshold,
      gstMaxThreshold,
      type,
    });

    await gst.save();
    res.status(201).json(gst);
  } catch (error) {
    res.status(500).json({ message: "Error creating GST", error });
  }
};

exports.getGST = async (req, res) => {
  const { type, gstThreshold } = req.query;

  let filter = {};

  if (type) {
    filter.type = type;
  }

  if (gstThreshold) {
    const gstThresholdValue = parseFloat(gstThreshold);

    filter.gstMinThreshold = { $lte: gstThresholdValue };
    filter.gstMaxThreshold = { $gte: gstThresholdValue };
  }

  try {
    const gst = await GST.findOne(filter);

    if (!gst) {
      return res.status(404).json({ message: "GST document not found" });
    }

    res.status(200).json(gst);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GST", error });
  }
};

exports.getAllGST = async (req, res) => {
  try {
    const gst = await GST.find();
    if (!gst || gst.length === 0) {
      return res.status(404).json({ message: "No GST documents found" });
    }
    res.status(200).json(gst);
  } catch (error) {
    res.status(500).json({ message: "Error fetching GST", error });
  }
};

exports.updateGST = async (req, res) => {
  const { _id, gstPrice, gstMinThreshold, gstMaxThreshold, type } = req.body;

  try {
    const updatedGst = await GST.findOneAndUpdate(
      { _id: _id },
      { gstPrice, gstMinThreshold, gstMaxThreshold, type },
      { new: true },
    );

    if (!updatedGst) {
      return res.status(404).json({ message: "GST document not found" });
    }

    res.status(200).json(updatedGst);
  } catch (error) {
    res.status(500).json({ message: "Error updating GST", error: error.message });
  }
};


exports.deleteGST = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedGst = await GST.findByIdAndDelete(id);

    if (!deletedGst) {
      return res.status(404).json({ message: "GST document not found" });
    }

    res.status(200).json({ message: "GST document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting GST", error });
  }
}