const Invoice = require("../models/Invoice");
const Transaction = require("../models/Transaction");
const fs = require("fs");
const path = require("path");

// ==========================================
// UPLOAD INVOICE
// POST /api/invoices/upload
// ==========================================
const uploadInvoice = async (req, res, next) => {
    try {
        const {
            merchantName,
            invoiceNumber,
            invoiceDate,
            totalAmount,
            category
        } = req.body;

        // Validate required fields
        if (
            !merchantName ||
            !invoiceDate ||
            !totalAmount ||
            !category
        ) {
            // Delete uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                success: false,
                message:
                    "Merchant name, invoice date, amount and category are required"
            });
        }

        // Validate amount
        if (Number(totalAmount) <= 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }

            return res.status(400).json({
                success: false,
                message: "Invoice amount must be greater than zero"
            });
        }

        // Check uploaded file
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Invoice file is required"
            });
        }

        // Save invoice
        const invoice = await Invoice.create({
            user: req.user._id,
            merchantName,
            invoiceNumber: invoiceNumber || "",
            invoiceDate,
            totalAmount: Number(totalAmount),
            category,
            filePath: `/uploads/${req.file.filename}`,
            fileType: req.file.mimetype
        });

        res.status(201).json({
            success: true,
            message: "Invoice uploaded successfully",
            data: invoice
        });

    } catch (error) {
        // Remove uploaded file if something fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        next(error);
    }
};

// ==========================================
// GET ALL USER INVOICES
// GET /api/invoices
// ==========================================
const getInvoices = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({
            user: req.user._id
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            message: "Invoices fetched successfully",
            count: invoices.length,
            data: invoices
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// GET SINGLE INVOICE
// GET /api/invoices/:id
// ==========================================
const getInvoiceById = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        res.status(200).json({
            success: true,
            data: invoice
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// ADD INVOICE AS EXPENSE
// POST /api/invoices/:id/add-expense
// ==========================================
const addInvoiceAsExpense = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        // Prevent duplicate transaction
        if (invoice.expenseAdded) {
            return res.status(400).json({
                success: false,
                message:
                    "This invoice has already been added as an expense"
            });
        }

        // Create expense transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type: "Expense",
            amount: invoice.totalAmount,
            category: invoice.category,
            description: `Invoice - ${invoice.merchantName}`,
            date: invoice.invoiceDate
        });

        // Mark invoice as converted to expense
        invoice.expenseAdded = true;

        await invoice.save();

        res.status(201).json({
            success: true,
            message: "Invoice added as expense successfully",
            data: {
                invoice,
                transaction
            }
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// DELETE INVOICE
// DELETE /api/invoices/:id
// ==========================================
const deleteInvoice = async (req, res, next) => {
    try {
        const invoice = await Invoice.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found or access denied"
            });
        }

        // Delete physical file
        const fullFilePath = path.join(
            __dirname,
            "..",
            invoice.filePath
        );

        if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
        }

        // Delete invoice from MongoDB
        await invoice.deleteOne();

        res.status(200).json({
            success: true,
            message: "Invoice deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadInvoice,
    getInvoices,
    getInvoiceById,
    addInvoiceAsExpense,
    deleteInvoice
};