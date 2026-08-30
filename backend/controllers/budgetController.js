const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// ==========================================
// CREATE OR UPDATE BUDGET
// POST /api/budgets
// ==========================================
const createOrUpdateBudget = async (req, res, next) => {
    try {
        const { category, limit, month } = req.body;

        // Validate required fields
        if (!category || limit === undefined || !month) {
            return res.status(400).json({
                success: false,
                message: "Category, limit and month are required"
            });
        }

        const allowedCategories = [
            "Food",
            "Fun",
            "Travel",
            "Fuel",
            "Shopping",
            "Other"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid budget category"
            });
        }

        if (Number(limit) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Budget limit must be greater than zero"
            });
        }

        // Validate YYYY-MM format
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            return res.status(400).json({
                success: false,
                message: "Month must be in YYYY-MM format"
            });
        }

        // Check whether budget already exists
        let budget = await Budget.findOne({
            user: req.user._id,
            category,
            month
        });

        if (budget) {
            // Update existing budget
            budget.limit = Number(limit);
            await budget.save();

            return res.status(200).json({
                success: true,
                message: "Budget updated successfully",
                data: budget
            });
        }

        // Create new budget
        budget = await Budget.create({
            user: req.user._id,
            category,
            limit: Number(limit),
            month
        });

        res.status(201).json({
            success: true,
            message: "Budget created successfully",
            data: budget
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET ALL USER BUDGETS
// GET /api/budgets
// Optional: ?month=YYYY-MM
// ==========================================
const getBudgets = async (req, res, next) => {
    try {
        const { month } = req.query;

        const filter = {
            user: req.user._id
        };

        if (month) {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: "Month must be in YYYY-MM format"
                });
            }

            filter.month = month;
        }

        const budgets = await Budget.find(filter).sort({
            createdAt: -1
        });

        const budgetData = await Promise.all(
            budgets.map(async (budget) => {

                // Create date range for selected budget month
                const startDate = new Date(`${budget.month}-01T00:00:00.000Z`);

                const endDate = new Date(startDate);
                endDate.setUTCMonth(endDate.getUTCMonth() + 1);

                // Calculate expenses for this category and month
                const spending = await Transaction.aggregate([
                    {
                        $match: {
                            user: req.user._id,
                            type: "Expense",
                            category: budget.category,
                            date: {
                                $gte: startDate,
                                $lt: endDate
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalSpent: {
                                $sum: "$amount"
                            }
                        }
                    }
                ]);

                const spent =
                    spending.length > 0
                        ? spending[0].totalSpent
                        : 0;

                const remaining = Number(budget.limit) - spent;

                const percentage =
                    Number(budget.limit) > 0
                        ? Number(
                              (
                                  (spent / Number(budget.limit)) *
                                  100
                              ).toFixed(2)
                          )
                        : 0;

                return {
                    id: budget._id,
                    category: budget.category,
                    limit: budget.limit,
                    month: budget.month,
                    spent,
                    remaining,
                    percentage,
                    exceeded: spent > Number(budget.limit),
                    createdAt: budget.createdAt
                };
            })
        );

        res.status(200).json({
            success: true,
            message: "Budgets fetched successfully",
            count: budgetData.length,
            data: budgetData
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET SINGLE BUDGET
// GET /api/budgets/:id
// ==========================================
const getBudgetById = async (req, res, next) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found"
            });
        }

        res.status(200).json({
            success: true,
            data: budget
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// DELETE BUDGET
// DELETE /api/budgets/:id
// ==========================================
const deleteBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "Budget not found or access denied"
            });
        }

        await budget.deleteOne();

        res.status(200).json({
            success: true,
            message: "Budget deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrUpdateBudget,
    getBudgets,
    getBudgetById,
    deleteBudget
};