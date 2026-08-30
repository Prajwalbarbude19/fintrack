const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getUserProfile,
    updateUserProfile
} = require("../controllers/userController");

// Get logged-in user profile
router.get("/profile", protect, getUserProfile);

// Update logged-in user profile
router.put("/profile", protect, updateUserProfile);

module.exports = router;