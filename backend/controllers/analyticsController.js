const Transaction = require("../models/Transaction");

// ==========================================
// DASHBOARD SUMMARY
// GET /api/analytics/dashboard
// ==========================================
const getDashboardSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const totals = await Transaction.aggregate([
            {
                $match: {
                    user: userId
                }
            },
            {
                $group: {
                    _id: "$type",
                    total: {
                        $sum: "$amount"
                    }
                }
            }
        ]);

        let totalIncome = 0;
        let totalExpenses = 0;

        totals.forEach((item) => {
            if (item._id === "Income") {
                totalIncome = item.total;
            }

            if (item._id === "Expense") {
                totalExpenses = item.total;
            }
        });

        const totalBalance = totalIncome - totalExpenses;
        const totalSavings = totalIncome - totalExpenses;

        res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully",
            data: {
                totalIncome,
                totalExpenses,
                totalBalance,
                totalSavings
            }
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// EXPENSE CATEGORY ANALYTICS
// GET /api/analytics/categories
// ==========================================
const getCategoryAnalytics = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const categories = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: "Expense"
                }
            },
            {
                $group: {
                    _id: "$category",
                    total: {
                        $sum: "$amount"
                    }
                }
            },
            {
                $sort: {
                    total: -1
                }
            }
        ]);

        const formattedCategories = categories.map((item) => ({
            category: item._id,
            total: item.total
        }));

        res.status(200).json({
            success: true,
            message: "Category analytics fetched successfully",
            data: formattedCategories
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// MONTHLY INCOME VS EXPENSE
// GET /api/analytics/monthly
// ==========================================
const getMonthlyAnalytics = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    user: userId
                }
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$date"
                        },
                        month: {
                            $month: "$date"
                        },
                        type: "$type"
                    },
                    total: {
                        $sum: "$amount"
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        const months = {};

        monthlyData.forEach((item) => {
            const year = item._id.year;
            const monthNumber = item._id.month;

            const key = `${year}-${String(monthNumber).padStart(2, "0")}`;

            if (!months[key]) {
                months[key] = {
                    month: key,
                    income: 0,
                    expense: 0
                };
            }

            if (item._id.type === "Income") {
                months[key].income = item.total;
            } else if (item._id.type === "Expense") {
                months[key].expense = item.total;
            }
        });

        res.status(200).json({
            success: true,
            message: "Monthly analytics fetched successfully",
            data: Object.values(months)
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardSummary,
    getCategoryAnalytics,
    getMonthlyAnalytics
};