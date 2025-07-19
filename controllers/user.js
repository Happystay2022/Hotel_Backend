const booking = require('../models/booking/booking');
const userModel = require('../models/user');
const UserCoupon = require('../models/coupons/userCoupon')
const jwt = require('jsonwebtoken'); // Import the JWT library
require('dotenv').config(); // Load environment variables

//====================================================================================
const createSignup = async function (req, res) {
    try {
        const { email, mobile } = req.body;
        if (email) {
            const existingCoupon = await UserCoupon.find({ assignedTo: email });

            if (!existingCoupon) {
                const currentDate = new Date();
                const validity = new Date(currentDate.setDate(currentDate.getDate() + 7)); // 7-day validity

                await UserCoupon.create({
                    couponName: "Welcome50",
                    discountPrice: 50,
                    validity,
                    quantity: 1,
                    assignedTo: email,
                });
            }
        }
        if (email) {
            const findWithEmail = await userModel.findOne({ email: email });
            if (findWithEmail) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
        }

        if (mobile) {
            const findWithMobile = await userModel.findOne({ mobile: mobile });
            if (findWithMobile) {
                return res.status(400).json({ message: 'Mobile number is already in use' });
            }
        }

        const images = req.files ? req.files.map((file) => file.location) : [];

        const userData = {
            images,
            ...req.body,
        };

        const savedUser = await userModel.create(userData);

        return res.status(201).json({
            status: true,
            message: 'User has been created successfully',
            data: savedUser,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'Something went wrong while creating the user',
        });
    }
};

//======================================================
const getUserById = async function (req, res) {
    try {
        let userId = req.params.userId;

        let checkData = await userModel.findOne({ userId: userId });
        if (!checkData) {
            return res.status(404).send({ status: false, message: 'userId not exist' });
        }

        return res.status(200).send({
            status: true,
            message: 'Users Profile Details',
            data: checkData,
        });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

//=====================================Google Sign in=================================

const GoogleSignIn = async function (req, res) {
    try {
        const { email, uid, userName, images } = req.body;
        if (email) {
            const existingCoupon = await UserCoupon.find({ assignedTo: email });

            if (!existingCoupon) {
                const currentDate = new Date();
                const validity = new Date(currentDate.setDate(currentDate.getDate() + 7)); // 7-day validity

                await UserCoupon.create({
                    couponName: "Welcome50",
                    discountPrice: 50,
                    validity,
                    quantity: 1,
                    assignedTo: email,
                });
            }
        }
        // Check if the user already exists based on email or UID
        const existingUser = await userModel.findOne({ $or: [{ email }, { uid }] });

        if (existingUser) {
            // If user already exists, generate a JWT token
            const token = jwt.sign({ id: existingUser.userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res
                .status(201)
                .json({ message: 'User already exists', userId: existingUser.userId, mobile: existingUser.mobile, rsToken: token });
        }

        // If user doesn't exist, create a new user
        const user = await userModel.create({ email, uid, userName, images });


        const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({ message: 'Sign-in successful', userId: user.userId, rsToken: token });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

//==============================================SIGN IN==============================

const signIn = async function (req, res) {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await userModel.findOne({ email });

        // If user does not exist
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if the provided password matches the stored password
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Return success response with token
        res.status(200).json({ message: 'Sign-in successful', userId: user.userId, mobile:user.mobile,email:user.email, rsToken: token });
    } catch (error) {
        console.error('Sign-in error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//==========================get count of users===========================//
const totalUser = async function (req, res) {
    try {
        const getall = await userModel.countDocuments({});
        res.status(200).json(getall);
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

//=====================================================================
const update = async (req, res) => {
    try {
        const { userId, userName, address, email, mobile, password } = req.body;

        if (email) {
            const findWithEmail = await userModel.findOne({ email: email, userId: { $ne: userId } });
            if (findWithEmail) {
                return res.status(400).json({ message: 'Email is already in use by another user' });
            }
        }

        if (mobile) {
            const findWithMobile = await userModel.findOne({ mobile: mobile, userId: { $ne: userId } });
            if (findWithMobile) {
                return res.status(400).json({ message: 'Mobile number is already in use by another user' });
            }
        }

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map((file) => file.location);
        } else {
            const user = await userModel.findOne({ userId });
            if (user) {
                images = user.images || [];
            }
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { userId },
            {
                userName,
                address,
                email,
                mobile,
                password,
                images,
            },
            { new: true }
        );

        if (updatedUser) {
            return res.json(updatedUser);
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
};

//===============================================================================
const getAllUsers = async (req, res) => {
    try {
        const userData = await userModel.find();
        return res.status(200).json({
            message: 'User data fetched successfully',
            data: userData,
        });
    } catch (error) {
        console.error('Error fetching user data:', error); // Log error for debugging
        return res.status(500).json({
            message: 'Something went wrong',
            error: error.message, // Optionally include the error message
        });
    }
};

const findUser = async (req, res) => {
    try {
        let { mobile, email } = req.query;

        // Build the query object
        let query = {};
        if (mobile) {
            query.mobile = mobile;
        }
        if (email) {
            query.email = email;
        }

        // Find user(s) based on the query
        const findUserData = await userModel.find(query); // Correct the method call

        // Check if any user data was found
        if (findUserData.length > 0) {
            return res.status(200).json({ success: true, data: findUserData });
        } else {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const getAllUserBulkById = async (req, res) => {
    try {
        const { userIds } = req.body;

        const users = await userModel.find({ userId: { $in: userIds } }).select("userName mobile");

        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users by IDs:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getAllUserDetails = async (req, res) => {
    try {
        const users = await userModel.find();

        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }

        const userData = await Promise.all(
            users.map(async (user) => {
                const bookings = await booking.find(
                    { 'user.userId': user.userId },
                    {
                        _id: 0,
                        bookingId: 1,
                        checkInDate: 1,
                        checkOutDate: 1,
                        bookingStatus: 1,
                        price: 1,
                        roomDetails: 1,
                        hotelDetails: {
                            hotelName: 1,
                            hotelCity: 1,
                            hotelEmail: 1
                        }
                    }
                );

                return {
                    userId: user.userId,
                    name: user.userName,
                    email: user.email,
                    mobile: user.mobile,
                    profile: user?.images,
                    address: user?.address,
                    bookings: bookings
                };
            })
        );

        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    createSignup,
    getUserById,
    signIn,
    GoogleSignIn,
    update,
    getAllUserBulkById,
    getAllUsers,
    totalUser,
    findUser,
    getAllUserDetails
};
