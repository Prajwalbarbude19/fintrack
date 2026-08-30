const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        category: {
            type: String,
            enum: [
                "Food",
                "Fun",
                "Travel",
                "Fuel",
                "Shopping",
                "Other"
            ],
            required: [true, "Budget category is required"]
        },

        limit: {
            type: Number,
            required: [true, "Budget limit is required"],
            min: [0.01, "Budget limit must be greater than zero"]
        },

        // Format: YYYY-MM
        month: {
            type: String,
            required: [true, "Budget month is required"],
            match: [
                /^\d{4}-(0[1-9]|1[0-2])$/,
                "Month must be in YYYY-MM format"
            ]
        }
    },
    {
        timestamps: true
    }
);

// One budget per user + category + month
budgetSchema.index(
    {
        user: 1,
        category: 1,
        month: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Budget", budgetSchema);