const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: ["Income", "Expense"],
            required: [true, "Transaction type is required"]
        },

        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than zero"]
        },

        category: {
            type: String,
            enum: [
                "Food",
                "Fun",
                "Travel",
                "Fuel",
                "Shopping",
                "Bills",
                "Health",
                "Education",
                "Other"
            ],
            required: [true, "Category is required"]
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [200, "Description cannot exceed 200 characters"]
        },

        date: {
            type: Date,
            required: [true, "Transaction date is required"]
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);