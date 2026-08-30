const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getDashboardSummary,
    getCategoryAnalytics,
    getMonthlyAnalytics
} = require("../controllers/analyticsController");

// All analytics routes are protected

router.get("/dashboard", protect, getDashboardSummary);

router.get("/categories", protect, getCategoryAnalytics);

router.get("/monthly", protect, getMonthlyAnalytics);

module.exports = router;