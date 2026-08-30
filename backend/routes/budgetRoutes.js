const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createOrUpdateBudget,
    getBudgets,
    getBudgetById,
    deleteBudget
} = require("../controllers/budgetController");

// All budget routes require login

// Create or update budget
router.post("/", protect, createOrUpdateBudget);

// Get all budgets
router.get("/", protect, getBudgets);

// Get single budget
router.get("/:id", protect, getBudgetById);

// Delete budget
router.delete("/:id", protect, deleteBudget);

module.exports = router;