const Transaction = require("../models/Transaction");

// ==========================================
// CREATE TRANSACTION
// POST /api/transactions
// ==========================================
const createTransaction = async (req, res, next) => {
    try {
        const { type, amount, category, description, date } = req.body;

        // Validation
        if (!type || !amount || !category || !description || !date) {
            return res.status(400).json({
                success: false,
                message: "All transaction fields are required"
            });
        }

        if (!["Income", "Expense"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Transaction type must be Income or Expense"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero"
            });
        }

        const transaction = await Transaction.create({
            user: req.user._id,
            type,
            amount: Number(amount),
            category,
            description,
            date
        });

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET ALL TRANSACTIONS
// GET /api/transactions
// ==========================================
const getTransactions = async (req, res, next) => {
    try {
        const { type, category, month } = req.query;

        const filter = {
            user: req.user._id
        };

        // Filter by type
        if (type) {
            filter.type = type;
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by month (YYYY-MM)
        if (month) {
            const startDate = new Date(`${month}-01`);

            if (Number.isNaN(startDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid month format. Use YYYY-MM"
                });
            }

            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            filter.date = {
                $gte: startDate,
                $lt: endDate
            };
        }

        const transactions = await Transaction.find(filter)
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Transactions fetched successfully",
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET SINGLE TRANSACTION
// GET /api/transactions/:id
// ==========================================
const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// UPDATE TRANSACTION
// PUT /api/transactions/:id
// ==========================================
const updateTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found or access denied"
            });
        }

        const { type, amount, category, description, date } = req.body;

        if (type !== undefined) {
            if (!["Income", "Expense"].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "Transaction type must be Income or Expense"
                });
            }

            transaction.type = type;
        }

        if (amount !== undefined) {
            if (Number(amount) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be greater than zero"
                });
            }

            transaction.amount = Number(amount);
        }

        if (category !== undefined) {
            transaction.category = category;
        }

        if (description !== undefined) {
            transaction.description = description;
        }

        if (date !== undefined) {
            transaction.date = date;
        }

        const updatedTransaction = await transaction.save();

        res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            data: updatedTransaction
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// DELETE TRANSACTION
// DELETE /api/transactions/:id
// ==========================================
const deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found or access denied"
            });
        }

        await transaction.deleteOne();

        res.status(200).json({
            success: true,
            message: "Transaction deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};