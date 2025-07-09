const Complaint = require('../models/complaint');

const createComplaint = async (req, res) => {
    const { userId, regarding, hotelName, hotelEmail, bookingId, status, issue, hotelId } = req.body;
    const images = req.files ? req.files.map((file) => file.location) : [];
    try {
        if (!userId || !regarding || !issue) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }
        // Check for existing pending complaints
        const pendingComplaints = await Complaint.countDocuments({
            userId,
            status: 'Pending',
        });

        if (pendingComplaints >= 3) {
            return res.status(400).json({
                message: 'You have too many pending complaints. Please resolve them before creating a new one.',
            });
        }

        // Create new complaint
        const newComplaint = new Complaint({
            userId,
            hotelId,
            regarding,
            hotelEmail,
            hotelName,
            bookingId,
            images,
            status: status || 'Pending', // Default to 'Pending' if not provided
            issue,
        });

        await newComplaint.save();

        res.status(201).json(newComplaint);
    } catch (error) {
        console.error('Error creating complaint:', error); // Log error for debugging
        res.status(500).json({ message: 'An error occurred while creating the complaint.' });
    }
};

//=============================================================================================
//not===========
const approveComplaint = async (req, res) => {
    const { id } = req.params; // id should be the complaint's identifier
    const { status, feedBack, updatedBy } = req.body; // Extract updatedBy from request body

    try {
        if (!id) {
            return res.status(400).json({ success: false, message: 'Complaint ID is required' });
        }

        // Update the complaint, including status, feedback, and updatedBy
        const updatedComplaint = await Complaint.findByIdAndUpdate(id, { status, feedBack, updatedBy }, { new: true, runValidators: true });

        if (!updatedComplaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        return res.status(200).json({ success: true, updatedComplaint });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

//=============================================================================================
const getComplaintsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const complaints = await Complaint.find({ userId });
        return res.status(200).json(complaints);
    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong',
            error: error.message,
        });
    }
};

//=======================delete a complaint=============================================
const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the complaint exists
        const deletedData = await Complaint.findByIdAndDelete(id);

        if (!deletedData) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        // Respond with the deleted complaint data
        res.status(200).json({ message: 'Complaint deleted successfully', data: deletedData });
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//=======================get all complaint=============================================

const getComplaint = async (req, res) => {
    const fetchAll = await Complaint.find();
    return res.status(200).json(fetchAll);
};
//================================filter complaints ============================================
const filteredComplaints = async (req, res) => {
    try {
        // Extract query parameters
        const { status, hotelName, hotelEmail, complaintId } = req.query;

        // Build filter object
        let filter = {};
        if (status) {
            filter.status = status;
        }
        if (complaintId) {
            filter.complaintId = complaintId;
        }
        if (hotelName) {
            filter.hotelName = { $regex: hotelName, $options: 'i' }; // Case-insensitive search
        }
        if (hotelEmail) {
            filter.hotelEmail = { $regex: hotelEmail, $options: 'i' }; // Case-insensitive search
        }

        // Fetch filtered complaints
        const complaints = await Complaint.find(filter);

        // Send response
        res.status(200).json(complaints);
    } catch (error) {
        console.error('Error fetching filtered complaints:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
//============================================================================
module.exports = {
    createComplaint,
    approveComplaint,
    getComplaintsByUserId,
    deleteComplaint,
    filteredComplaints,
    getComplaint,
    deleteComplaint,
};
