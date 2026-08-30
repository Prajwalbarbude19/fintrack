const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    uploadInvoice,
    getInvoices,
    getInvoiceById,
    addInvoiceAsExpense,
    deleteInvoice
} = require("../controllers/invoiceController");

// Upload invoice
router.post(
    "/upload",
    protect,
    upload.single("invoiceFile"),
    uploadInvoice
);

// Get all invoices
router.get("/", protect, getInvoices);

// Get single invoice
router.get("/:id", protect, getInvoiceById);

// Convert invoice into expense
router.post("/:id/add-expense", protect, addInvoiceAsExpense);

// Delete invoice
router.delete("/:id", protect, deleteInvoice);

module.exports = router;