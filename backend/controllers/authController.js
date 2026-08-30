const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

/* =========================================
   GENERATE JWT TOKEN
========================================= */

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || "7d"
        }
    );
};

/* =========================================
   REGISTER USER
   POST /api/auth/register
========================================= */

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Validate fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Clean email
        const normalizedEmail = email.toLowerCase().trim();

        // Basic password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        // Generate token
        const token = generateToken(user._id);

        // Send response
        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

/* =========================================
   LOGIN USER
   POST /api/auth/login
========================================= */

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user WITH password
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        // User not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Successful login
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

/* =========================================
   GET CURRENT USER
   GET /api/auth/me
========================================= */

const getCurrentUser = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            createdAt: req.user.createdAt
        }
    });
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};