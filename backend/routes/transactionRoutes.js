const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

// All transaction routes are protected

router.post("/", protect, createTransaction);

router.get("/", protect, getTransactions);

router.get("/:id", protect, getTransactionById);

router.put("/:id", protect, updateTransaction);

router.delete("/:id", protect, deleteTransaction);

module.exports = router;