// =====================================================
// FINTRACK BACKEND SERVER
// =====================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Database connection
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// Middleware
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();


// =====================================================
// CONNECT DATABASE
// =====================================================

connectDB();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);


// User
app.use(
    "/api/users",
    userRoutes
);


// Transactions
app.use(
    "/api/transactions",
    transactionRoutes
);


// Budgets
app.use(
    "/api/budgets",
    budgetRoutes
);


// Invoices
app.use(
    "/api/invoices",
    invoiceRoutes
);


// Analytics
app.use(
    "/api/analytics",
    analyticsRoutes
);


// =====================================================
// SERVE FRONTEND FILES
// =====================================================

// Your frontend files are outside the backend folder
const frontendPath = path.join(__dirname, "..");

app.use(
    express.static(frontendPath)
);


// Open FinTrack when visiting the root URL
app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );

});


// =====================================================
// API 404 ROUTE
// =====================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({
            success: false,
            message: "API route not found"
        });

    }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(errorMiddleware);


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 5050;


app.listen(
    PORT,
    () => {

        console.log(
            `FinTrack server running at http://127.0.0.1:${PORT}`
        );

    }
);