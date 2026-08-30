const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        merchantName: {
            type: String,
            required: [true, "Merchant name is required"],
            trim: true
        },

        invoiceNumber: {
            type: String,
            trim: true,
            default: ""
        },

        invoiceDate: {
            type: Date,
            required: [true, "Invoice date is required"]
        },

        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
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

        filePath: {
            type: String,
            required: true
        },

        fileType: {
            type: String,
            required: true
        },

        // Prevent the same invoice from creating
        // multiple expense transactions
        expenseAdded: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Invoice", invoiceSchema);