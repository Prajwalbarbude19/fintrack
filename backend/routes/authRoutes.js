const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getCurrentUser
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

/* =========================================
   AUTH ROUTES
========================================= */

// Register new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get currently logged-in user
router.get("/me", protect, getCurrentUser);

module.exports = router;