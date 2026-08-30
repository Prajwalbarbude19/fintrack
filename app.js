/* =========================================================
   FINTRACK - FULL STACK FRONTEND
   CONNECTED TO NODE + EXPRESS + MONGODB
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

// Backend server URL
const API_BASE = "/api";


/* =========================================================
   CATEGORIES
========================================================= */

const categories = [
    { name: "Food", icon: "🍔" },
    { name: "Fun", icon: "🎉" },
    { name: "Travel", icon: "✈️" },
    { name: "Fuel", icon: "⛽" },
    { name: "Shopping", icon: "🛍️" },
    { name: "Bills", icon: "🏠" },
    { name: "Health", icon: "💊" },
    { name: "Education", icon: "📚" },
    { name: "Other", icon: "📦" }
];


const budgetCategories = [
    "Food",
    "Fun",
    "Travel",
    "Fuel",
    "Shopping",
    "Other"
];


/* =========================================================
   GLOBAL DATA
========================================================= */

let transactions = [];

let budgets = {};

let currentUser = null;


let expenseChart = null;
let incomeExpenseChart = null;

let analyticsExpenseChart = null;
let analyticsIncomeChart = null;


let selectedTransactionType = "expense";

let selectedInvoiceFile = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   TRANSACTION TYPE HELPERS
========================================================= */

// Frontend/UI always uses lowercase:
// "income" or "expense"

function normalizeTransactionType(type) {

    const value =
        String(
            type || "expense"
        ).toLowerCase();


    return value === "income"
        ? "income"
        : "expense";
}


// Backend expects exactly:
// "Income" or "Expense"

function getBackendTransactionType(type) {

    return normalizeTransactionType(type) === "income"
        ? "Income"
        : "Expense";
}


/* =========================================================
   AUTH TOKEN HELPERS
========================================================= */

function getToken() {

    return localStorage.getItem(
        "token"
    );
}


function setToken(token) {

    localStorage.setItem(
        "token",
        token
    );
}


function removeToken() {

    localStorage.removeItem(
        "token"
    );
}


/* =========================================================
   CURRENT USER HELPERS
========================================================= */

function saveCurrentUser(user) {

    currentUser = user;


    localStorage.setItem(
        "fintrack-current-user",
        JSON.stringify(user)
    );
}


function removeCurrentUser() {

    currentUser = null;


    localStorage.removeItem(
        "fintrack-current-user"
    );
}


function getCurrentUser() {

    const savedUser =
        localStorage.getItem(
            "fintrack-current-user"
        );


    if (!savedUser) {
        return null;
    }


    try {

        return JSON.parse(
            savedUser
        );

    } catch (error) {

        return null;
    }
}


/* =========================================================
   SAFE EVENT LISTENER
========================================================= */

function on(
    id,
    event,
    callback
) {

    const element = $(id);


    if (element) {

        element.addEventListener(
            event,
            callback
        );
    }
}


/* =========================================================
   API REQUEST FUNCTION
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getToken();


    const headers = {
        ...(options.headers || {})
    };


    // Automatically send JWT token

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;
    }


    // Add JSON header only when
    // body is NOT FormData

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    let response;


    try {

        response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );


        throw new Error(
            "Cannot connect to backend server. Make sure the backend is running."
        );
    }


    let data;


    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            "Invalid response received from server."
        );
    }


    if (!response.ok) {

        // If JWT has expired or is invalid

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            removeToken();

            removeCurrentUser();
        }


        throw new Error(
            data.message ||
            "Something went wrong."
        );
    }


    return data;
}


/* =========================================================
   TOAST NOTIFICATION
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        $("toast");


    if (!toast) {

        alert(message);

        return;
    }


    toast.textContent =
        message;


    toast.className =
        `toast ${type} show`;


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );
}


/* =========================================================
   AUTH API FUNCTIONS
========================================================= */

async function registerUser(
    name,
    email,
    password
) {

    const data =
        await apiRequest(
            "/auth/register",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        name,
                        email,
                        password
                    })
            }
        );


    return data;
}


async function loginUser(
    email,
    password
) {

    const data =
        await apiRequest(
            "/auth/login",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        email,
                        password
                    })
            }
        );


    return data;
}


/* =========================================================
   USER PROFILE API
========================================================= */

async function getUserProfile() {

    const data =
        await apiRequest(
            "/users/profile"
        );


    return (
        data.user ||
        data.data ||
        data
    );
}


async function updateUserProfile(
    profileData
) {

    const data =
        await apiRequest(
            "/users/profile",
            {
                method: "PUT",

                body:
                    JSON.stringify(
                        profileData
                    )
            }
        );


    return (
        data.user ||
        data.data ||
        data
    );
}


/* =========================================================
   TRANSACTION API
========================================================= */

async function getTransactions(
    filters = {}
) {

    const params =
        new URLSearchParams();


    Object.entries(
        filters
    ).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                params.append(
                    key,
                    value
                );
            }
        }
    );


    const queryString =
        params.toString();


    const endpoint =
        queryString
            ? `/transactions?${queryString}`
            : "/transactions";


    const data =
        await apiRequest(
            endpoint
        );


    const transactionList =
        data.transactions ||
        data.data ||
        [];


    return transactionList.map(
        normalizeTransaction
    );
}


/* =========================================================
   CREATE TRANSACTION

   IMPORTANT:
   Frontend uses lowercase:
   income / expense

   Backend receives:
   Income / Expense
========================================================= */

async function createTransaction(
    transactionData
) {

    const backendTransactionData = {

        ...transactionData,


        type:
            getBackendTransactionType(
                transactionData.type
            )
    };


    console.log(
        "Sending transaction:",
        backendTransactionData
    );


    const data =
        await apiRequest(
            "/transactions",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        backendTransactionData
                    )
            }
        );


    const transaction =
        data.transaction ||
        data.data ||
        data;


    return normalizeTransaction(
        transaction
    );
}


/* =========================================================
   UPDATE TRANSACTION
========================================================= */

async function updateTransaction(
    id,
    transactionData
) {

    const backendTransactionData = {

        ...transactionData,


        type:
            getBackendTransactionType(
                transactionData.type
            )
    };


    const data =
        await apiRequest(
            `/transactions/${id}`,
            {
                method: "PUT",

                body:
                    JSON.stringify(
                        backendTransactionData
                    )
            }
        );


    const transaction =
        data.transaction ||
        data.data ||
        data;


    return normalizeTransaction(
        transaction
    );
}


/* =========================================================
   DELETE TRANSACTION
========================================================= */

async function deleteTransaction(
    id
) {

    return await apiRequest(
        `/transactions/${id}`,
        {
            method: "DELETE"
        }
    );
}


/* =========================================================
   NORMALIZE TRANSACTION

   MongoDB:
   _id
   Income / Expense

   Frontend:
   id
   income / expense
========================================================= */

function normalizeTransaction(
    transaction
) {

    if (!transaction) {

        return null;
    }


    return {

        ...transaction,


        id:
            transaction._id ||
            transaction.id,


        type:
            normalizeTransactionType(
                transaction.type
            ),


        amount:
            Number(
                transaction.amount || 0
            ),


        date:
            transaction.date
                ? String(
                    transaction.date
                )
                    .split("T")[0]
                : ""
    };
}
/* =========================================================
   ADDITIONAL HELPERS
========================================================= */

function formatCurrency(amount) {

    const value =
        Number(amount) || 0;

    return value.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    );
}


function formatDate(date) {

    if (!date) {
        return "";
    }

    const dateObject =
        new Date(date);


    if (isNaN(dateObject)) {
        return "";
    }


    return dateObject.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getInitial(name) {

    return name
        ? name.charAt(0).toUpperCase()
        : "U";
}


function getCategoryIcon(categoryName) {

    const category =
        categories.find(
            category =>
                category.name === categoryName
        );


    return category
        ? category.icon
        : "📦";
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");


    if (!container) {

        alert(message);

        return;
    }


    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        info: "fa-circle-info"
    };


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;


    container.appendChild(toast);


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateX(30px)";


        setTimeout(
            () => toast.remove(),
            300
        );

    }, 3000);
}


/* =========================================================
   AUTH SCREEN
========================================================= */

function showApp() {

    if ($("authScreen")) {

        $("authScreen")
            .classList.add("hidden");
    }


    if ($("mainApp")) {

        $("mainApp")
            .classList.remove("hidden");
    }


    updateUserUI();

    renderAll();
}


function showAuth() {

    if ($("mainApp")) {

        $("mainApp")
            .classList.add("hidden");
    }


    if ($("authScreen")) {

        $("authScreen")
            .classList.remove("hidden");
    }
}


/* =========================================================
   SWITCH LOGIN / SIGNUP
========================================================= */

on(
    "showSignup",
    "click",
    () => {

        $("loginBox")
            ?.classList.add("hidden");


        $("signupBox")
            ?.classList.remove("hidden");


        if ($("authMessage")) {

            $("authMessage").textContent = "";
        }
    }
);


on(
    "showLogin",
    "click",
    () => {

        $("signupBox")
            ?.classList.add("hidden");


        $("loginBox")
            ?.classList.remove("hidden");


        if ($("authMessage")) {

            $("authMessage").textContent = "";
        }
    }
);


/* =========================================================
   REGISTER USER
========================================================= */

on(
    "signupForm",
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            $("signupName")
                .value
                .trim();


        const email =
            $("signupEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            $("signupPassword")
                .value;


        const confirmPasswordInput =
            $("confirmPassword");


        if (
            confirmPasswordInput &&
            password !== confirmPasswordInput.value
        ) {

            $("authMessage").style.color =
                "red";


            $("authMessage").textContent =
                "Passwords do not match.";

            return;
        }


        if (!name || !email || !password) {

            $("authMessage").style.color =
                "red";


            $("authMessage").textContent =
                "Please fill all fields.";

            return;
        }


        try {

            const data =
                await apiRequest(
                    "/auth/register",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            name,
                            email,
                            password
                        })
                    }
                );


            $("authMessage").style.color =
                "green";


            $("authMessage").textContent =
                data.message ||
                "Account created successfully! Please login.";


            $("signupForm").reset();


            setTimeout(() => {

                $("signupBox")
                    ?.classList.add("hidden");


                $("loginBox")
                    ?.classList.remove("hidden");


                if ($("loginEmail")) {

                    $("loginEmail").value =
                        email;
                }

            }, 700);


        } catch (error) {

            $("authMessage").style.color =
                "red";


            $("authMessage").textContent =
                error.message;
        }
    }
);


/* =========================================================
   LOGIN USER
========================================================= */

on(
    "loginForm",
    "submit",
    async (event) => {

        event.preventDefault();


        const email =
            $("loginEmail")
                .value
                .trim()
                .toLowerCase();


        const password =
            $("loginPassword")
                .value;


        try {

            const data =
                await apiRequest(
                    "/auth/login",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            email,
                            password
                        })
                    }
                );


            if (!data.token) {

                throw new Error(
                    "Login token was not received from server."
                );
            }


            // Save JWT token
            setToken(data.token);


            // Save user information
            if (data.user) {

                saveCurrentUser(
                    data.user
                );

            } else {

                currentUser = {
                    name:
                        email.split("@")[0],

                    email
                };
            }


            if ($("authMessage")) {

                $("authMessage").textContent =
                    "";
            }


            $("loginForm").reset();


            // Load latest MongoDB data
            await loadInitialData();


            showApp();


            showToast(
                "Login successful!"
            );


        } catch (error) {

            if ($("authMessage")) {

                $("authMessage").style.color =
                    "red";


                $("authMessage").textContent =
                    error.message;
            }
        }
    }
);


/* =========================================================
   LOGOUT
========================================================= */

on(
    "logoutBtn",
    "click",
    () => {

        removeToken();

        removeCurrentUser();


        transactions = [];

        budgets = {};


        showAuth();


        $("loginBox")
            ?.classList.remove("hidden");


        $("signupBox")
            ?.classList.add("hidden");


        showToast(
            "Logged out successfully.",
            "info"
        );
    }
);


/* =========================================================
   USER PROFILE
========================================================= */

function updateUserUI() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUser.name ||
        "User";


    const email =
        currentUser.email ||
        "";


    const initial =
        getInitial(name);


    if ($("sidebarUserName")) {

        $("sidebarUserName").textContent =
            name;
    }


    if ($("welcomeUserName")) {

        $("welcomeUserName").textContent =
            name.split(" ")[0];
    }


    if ($("headerUserName")) {

        $("headerUserName").textContent =
            name.split(" ")[0];
    }


    if ($("profileAvatar")) {

        $("profileAvatar").textContent =
            initial;
    }


    if ($("headerAvatar")) {

        $("headerAvatar").textContent =
            initial;
    }


    if ($("settingsAvatar")) {

        $("settingsAvatar").textContent =
            initial;
    }


    if ($("settingsName")) {

        $("settingsName").value =
            name;
    }


    if ($("settingsEmail")) {

        $("settingsEmail").value =
            email;
    }
}


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadProfile() {

    try {

        const data =
            await apiRequest(
                "/users/profile"
            );


        const user =
            data.user ||
            data.data ||
            data;


        if (user && user.email) {

            saveCurrentUser(user);

            updateUserUI();
        }


    } catch (error) {

        console.log(
            "Profile loading skipped:",
            error.message
        );
    }
}


/* =========================================================
   UPDATE PROFILE
========================================================= */

on(
    "saveProfileBtn",
    "click",
    async () => {

        const newName =
            $("settingsName")
                ?.value
                .trim();


        if (!newName) {

            showToast(
                "Please enter your name.",
                "error"
            );

            return;
        }


        try {

            const data =
                await apiRequest(
                    "/users/profile",
                    {
                        method: "PUT",

                        body: JSON.stringify({
                            name: newName
                        })
                    }
                );


            const user =
                data.user ||
                data.data ||
                data;


            if (user) {

                saveCurrentUser({
                    ...currentUser,
                    ...user
                });

            } else {

                currentUser.name =
                    newName;


                saveCurrentUser(
                    currentUser
                );
            }


            updateUserUI();


            showToast(
                "Profile updated successfully."
            );


        } catch (error) {

            showToast(
                error.message,
                "error"
            );
        }
    }
);


/* =========================================================
   NAVIGATION
========================================================= */

const pageInfo = {

    dashboard: {
        title: "Dashboard",
        subtitle:
            "Track and manage your finances."
    },


    transactions: {
        title: "Transactions",
        subtitle:
            "Manage your financial activity."
    },


    analytics: {
        title: "Analytics",
        subtitle:
            "Understand your spending habits."
    },


    categories: {
        title: "Categories",
        subtitle:
            "Explore your spending categories."
    },


    budget: {
        title: "Budget",
        subtitle:
            "Plan and control your spending."
    },


    invoice: {
        title: "Upload Invoice",
        subtitle:
            "Add receipts and invoices as expenses."
    },


    settings: {
        title: "Settings",
        subtitle:
            "Manage your preferences."
    }
};


document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                switchSection(
                    button.dataset.section
                );
            }
        );
    });


function switchSection(section) {

    if (!section) {
        return;
    }


    document
        .querySelectorAll(".page-section")
        .forEach(page => {

            page.classList.remove(
                "active-page"
            );
        });


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });


    $(section)
        ?.classList.add(
            "active-page"
        );


    document
        .querySelector(
            `.nav-item[data-section="${section}"]`
        )
        ?.classList.add("active");


    if (
        $("pageTitle") &&
        pageInfo[section]
    ) {

        $("pageTitle").textContent =
            pageInfo[section].title;
    }


    if (
        $("pageSubtitle") &&
        pageInfo[section]
    ) {

        $("pageSubtitle").textContent =
            pageInfo[section].subtitle;
    }
}
/* =========================================================
   MOBILE SIDEBAR
========================================================= */

on(
    "mobileMenuBtn",
    "click",
    () => {

        $("sidebar")
            ?.classList.add(
                "mobile-open"
            );

        $("sidebarOverlay")
            ?.classList.add(
                "show"
            );
    }
);


on(
    "closeSidebar",
    "click",
    closeMobileSidebar
);


on(
    "sidebarOverlay",
    "click",
    closeMobileSidebar
);


function closeMobileSidebar() {

    $("sidebar")
        ?.classList.remove(
            "mobile-open"
        );

    $("sidebarOverlay")
        ?.classList.remove(
            "show"
        );
}


/* =========================================================
   CATEGORY SELECTS
========================================================= */

function populateCategorySelects() {

    const transactionCategory =
        $("transactionCategory");

    const invoiceCategory =
        $("invoiceCategory");

    const filterCategory =
        $("filterCategory");


    if (transactionCategory) {

        transactionCategory.innerHTML =
            `<option value="">Select Category</option>`;
    }


    if (invoiceCategory) {

        invoiceCategory.innerHTML =
            `<option value="">Select Category</option>`;
    }


    if (filterCategory) {

        filterCategory.innerHTML =
            `<option value="all">All Categories</option>`;
    }


    categories.forEach(category => {

        if (transactionCategory) {

            transactionCategory.innerHTML += `
                <option value="${category.name}">
                    ${category.icon} ${category.name}
                </option>
            `;
        }


        if (invoiceCategory) {

            invoiceCategory.innerHTML += `
                <option value="${category.name}">
                    ${category.icon} ${category.name}
                </option>
            `;
        }


        if (filterCategory) {

            filterCategory.innerHTML += `
                <option value="${category.name}">
                    ${category.name}
                </option>
            `;
        }
    });
}


/* =========================================================
   LOAD TRANSACTIONS FROM BACKEND
========================================================= */

async function loadTransactions() {

    try {

        const data =
            await apiRequest(
                "/transactions"
            );


        const list =
            Array.isArray(data)
                ? data
                : (
                    data.transactions ||
                    data.data ||
                    []
                );


        transactions =
            list
                .map(normalizeTransaction)
                .filter(
                    transaction =>
                        transaction !== null
                );


    } catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   LOAD BUDGETS
========================================================= */

async function loadBudgets() {

    try {

        const data =
            await apiRequest(
                "/budgets"
            );


        const budgetData =
            data.budgets ||
            data.data ||
            data;


        // If backend returns an array

        if (Array.isArray(budgetData)) {

            budgets = {};


            budgetData.forEach(budget => {

                const category =
                    budget.category;


                const amount =
                    budget.amount ??
                    budget.limit ??
                    budget.budget;


                if (category) {

                    budgets[category] =
                        Number(
                            amount || 0
                        );
                }
            });

        } else if (
            typeof budgetData === "object" &&
            budgetData !== null
        ) {

            budgets =
                budgetData || {};
        }


    } catch (error) {

        console.log(
            "Budget loading error:",
            error.message
        );

        budgets = {};
    }
}


/* =========================================================
   SAVE BUDGETS TO BACKEND
========================================================= */

async function saveBudgetsToBackend() {

    try {

        const data =
            await apiRequest(
                "/budgets",
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            budgets
                        })
                }
            );


        return data;


    } catch (putError) {

        // Try POST if backend uses POST

        try {

            return await apiRequest(
                "/budgets",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            budgets
                        })
                }
            );


        } catch (postError) {

            throw postError;
        }
    }
}


/* =========================================================
   LOAD ALL INITIAL DATA
========================================================= */

async function loadInitialData() {

    try {

        await Promise.all([
            loadProfile(),
            loadTransactions(),
            loadBudgets()
        ]);


        renderAll();


    } catch (error) {

        console.error(
            "Initial data loading error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   TRANSACTION MODAL
========================================================= */

function openTransactionModal(
    transaction = null
) {

    $("transactionModal")
        ?.classList.remove("hidden");


    if (transaction) {

        if ($("modalTitle")) {

            $("modalTitle").textContent =
                "Edit Transaction";
        }


        if ($("editingTransactionId")) {

            $("editingTransactionId").value =
                transaction.id;
        }


        if ($("transactionAmount")) {

            $("transactionAmount").value =
                transaction.amount;
        }


        if ($("transactionDate")) {

            $("transactionDate").value =
                transaction.date;
        }


        if ($("transactionCategory")) {

            $("transactionCategory").value =
                transaction.category;
        }


        if ($("transactionDescription")) {

            $("transactionDescription").value =
                transaction.description || "";
        }


        // IMPORTANT:
        // Backend may return Income/Expense.
        // Convert it back to lowercase for frontend.

        selectedTransactionType =
            normalizeTransactionType(
                transaction.type
            );


    } else {

        if ($("modalTitle")) {

            $("modalTitle").textContent =
                "Add Transaction";
        }


        $("transactionForm")
            ?.reset();


        if ($("editingTransactionId")) {

            $("editingTransactionId").value =
                "";
        }


        if ($("transactionDate")) {

            $("transactionDate").value =
                new Date()
                    .toISOString()
                    .split("T")[0];
        }


        selectedTransactionType =
            "expense";
    }


    updateTransactionTypeButtons();
}


/* =========================================================
   CLOSE TRANSACTION MODAL
========================================================= */

function closeTransactionModal() {

    $("transactionModal")
        ?.classList.add("hidden");


    $("transactionForm")
        ?.reset();


    if ($("editingTransactionId")) {

        $("editingTransactionId").value =
            "";
    }
}


/* =========================================================
   OPEN TRANSACTION BUTTONS
========================================================= */

on(
    "openTransactionBtn",
    "click",
    () => openTransactionModal()
);


on(
    "openTransactionBtn2",
    "click",
    () => openTransactionModal()
);


on(
    "addFirstTransactionBtn",
    "click",
    () => openTransactionModal()
);


/* =========================================================
   CLOSE TRANSACTION BUTTONS
========================================================= */

on(
    "closeTransactionModal",
    "click",
    closeTransactionModal
);


on(
    "cancelTransactionBtn",
    "click",
    closeTransactionModal
);


/* =========================================================
   TRANSACTION TYPE BUTTONS
========================================================= */

on(
    "expenseTypeBtn",
    "click",
    () => {

        selectedTransactionType =
            "expense";

        updateTransactionTypeButtons();
    }
);


on(
    "incomeTypeBtn",
    "click",
    () => {

        selectedTransactionType =
            "income";

        updateTransactionTypeButtons();
    }
);


function updateTransactionTypeButtons() {

    $("expenseTypeBtn")
        ?.classList.toggle(
            "active",
            selectedTransactionType === "expense"
        );


    $("incomeTypeBtn")
        ?.classList.toggle(
            "active",
            selectedTransactionType === "income"
        );
}


/* =========================================================
   SAVE TRANSACTION TO MONGODB
========================================================= */

on(
    "transactionForm",
    "submit",
    async (event) => {

        event.preventDefault();


        const editingId =
            $("editingTransactionId")
                ?.value;


        const transactionData = {

            // Keep lowercase here.
            // createTransaction/updateTransaction
            // automatically convert to Income/Expense.

            type:
                normalizeTransactionType(
                    selectedTransactionType
                ),


            amount:
                Number(
                    $("transactionAmount").value
                ),


            date:
                $("transactionDate").value,


            category:
                $("transactionCategory").value,


            description:
                $("transactionDescription")
                    .value
                    .trim()
        };


        if (
            !Number.isFinite(
                transactionData.amount
            ) ||
            transactionData.amount <= 0 ||
            !transactionData.category ||
            !transactionData.description ||
            !transactionData.date
        ) {

            showToast(
                "Please complete all transaction fields.",
                "error"
            );

            return;
        }


        try {

            if (editingId) {

                const updated =
                    await updateTransaction(
                        editingId,
                        transactionData
                    );


                transactions =
                    transactions.map(
                        transaction =>
                            transaction.id === editingId
                                ? updated
                                : transaction
                    );


                showToast(
                    "Transaction updated successfully."
                );


            } else {

                const created =
                    await createTransaction(
                        transactionData
                    );


                transactions.unshift(
                    created
                );


                showToast(
                    "Transaction added successfully."
                );
            }


            closeTransactionModal();


            renderAll();


        } catch (error) {

            console.error(
                "Transaction save error:",
                error
            );


            showToast(
                error.message ||
                "Unable to save transaction.",
                "error"
            );
        }
    }
);


/* =========================================================
   FINANCE TOTALS
========================================================= */

function getFinanceTotals() {

    const income =
        transactions
            .filter(
                transaction =>
                    transaction.type === "income"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.amount || 0
                    ),
                0
            );


    const expenses =
        transactions
            .filter(
                transaction =>
                    transaction.type === "expense"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.amount || 0
                    ),
                0
            );


    return {

        income,

        expenses,

        balance:
            income - expenses,

        savings:
            income - expenses
    };
}


/* =========================================================
   SUMMARY CARDS
========================================================= */

function updateSummaryCards() {

    const totals =
        getFinanceTotals();


    if ($("totalBalance")) {

        $("totalBalance").textContent =
            formatCurrency(
                totals.balance
            );
    }


    if ($("totalIncome")) {

        $("totalIncome").textContent =
            formatCurrency(
                totals.income
            );
    }


    if ($("totalExpenses")) {

        $("totalExpenses").textContent =
            formatCurrency(
                totals.expenses
            );
    }


    if ($("totalSavings")) {

        $("totalSavings").textContent =
            formatCurrency(
                totals.savings
            );
    }
}
/* =========================================================
   EXPENSE CHART
========================================================= */

function updateExpenseChartState() {

    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    if (!$("expenseEmptyState")) return;


    if (expenses.length === 0) {

        $("expenseEmptyState")
            ?.classList.remove("hidden");


        $("expenseChartWrapper")
            ?.classList.add("hidden");

    } else {

        $("expenseEmptyState")
            ?.classList.add("hidden");


        $("expenseChartWrapper")
            ?.classList.remove("hidden");
    }
}


function renderExpenseChart() {

    if (
        typeof Chart === "undefined" ||
        !$("expenseChart")
    ) {
        return;
    }


    updateExpenseChartState();


    const expenses =
        transactions.filter(
            transaction =>
                transaction.type === "expense"
        );


    if (expenses.length === 0) {

        if (expenseChart) {

            expenseChart.destroy();

            expenseChart = null;
        }

        return;
    }


    const categoryTotals = {};


    expenses.forEach(transaction => {

        categoryTotals[
            transaction.category
        ] =
            (
                categoryTotals[
                    transaction.category
                ] || 0
            )
            +
            Number(
                transaction.amount
            );
    });


    if (expenseChart) {

        expenseChart.destroy();
    }


    expenseChart =
        new Chart(
            $("expenseChart"),
            {

                type: "doughnut",

                data: {

                    labels:
                        Object.keys(
                            categoryTotals
                        ),

                    datasets: [

                        {

                            data:
                                Object.values(
                                    categoryTotals
                                ),

                            backgroundColor: [
                                "#7464e8",
                                "#55c7a2",
                                "#ed8dae",
                                "#e8b94f",
                                "#6ea9e9",
                                "#ff9f7e",
                                "#b58ce8",
                                "#76c7e5",
                                "#a7a9bb"
                            ],

                            borderWidth: 0,

                            borderRadius: 8
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "68%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                padding: 18,

                                usePointStyle: true
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   INCOME VS EXPENSE CHART
========================================================= */

function renderIncomeExpenseChart() {

    if (
        typeof Chart === "undefined" ||
        !$("incomeExpenseChart")
    ) {
        return;
    }


    const totals =
        getFinanceTotals();


    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();
    }


    incomeExpenseChart =
        new Chart(
            $("incomeExpenseChart"),
            {

                type: "bar",

                data: {

                    labels: [
                        "Income",
                        "Expenses",
                        "Savings"
                    ],

                    datasets: [

                        {

                            data: [
                                totals.income,
                                totals.expenses,
                                Math.max(
                                    totals.savings,
                                    0
                                )
                            ],

                            backgroundColor: [
                                "#55c7a2",
                                "#ed8dae",
                                "#7464e8"
                            ],

                            borderRadius: 12
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    }
                }
            }
        );
}


/* =========================================================
   RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions() {

    const container =
        $("recentTransactions");


    if (!container) return;


    const recent =
        [...transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-list">
                No transactions yet.<br>
                Start tracking your finances today ✨
            </div>
        `;

        return;
    }


    container.innerHTML =
        recent.map(transaction => `

            <div class="recent-item">

                <div class="recent-category-icon">
                    ${getCategoryIcon(
                        transaction.category
                    )}
                </div>


                <div class="recent-info">

                    <strong>
                        ${transaction.description}
                    </strong>

                    <span>
                        ${transaction.category}
                        •
                        ${formatDate(
                            transaction.date
                        )}
                    </span>

                </div>


                <div class="
                    recent-amount
                    ${transaction.type === "income"
                        ? "income-text"
                        : "expense-text"}
                ">

                    ${transaction.type === "income"
                        ? "+"
                        : "-"}

                    ${formatCurrency(
                        transaction.amount
                    )}

                </div>

            </div>

        `).join("");
}


/* =========================================================
   TRANSACTION TABLE
========================================================= */

function renderTransactionsTable() {

    const tbody =
        $("transactionsTableBody");


    if (!tbody) return;


    const filterType =
        $("filterType")?.value ||
        "all";


    const filterCategory =
        $("filterCategory")?.value ||
        "all";


    const search =
        (
            $("searchTransaction")
                ?.value ||
            ""
        )
        .toLowerCase();


    let filtered =
        [...transactions];


    if (filterType !== "all") {

        filtered =
            filtered.filter(
                transaction =>
                    transaction.type ===
                    filterType
            );
    }


    if (filterCategory !== "all") {

        filtered =
            filtered.filter(
                transaction =>
                    transaction.category ===
                    filterCategory
            );
    }


    if (search) {

        filtered =
            filtered.filter(
                transaction =>
                    (
                        transaction.description ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)
            );
    }


    filtered.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >
                    No transactions found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(transaction => `

            <tr>

                <td>

                    <div class="transaction-info">

                        <div class="transaction-info-icon">
                            ${getCategoryIcon(
                                transaction.category
                            )}
                        </div>


                        <div>

                            <strong>
                                ${transaction.description}
                            </strong>

                            <span>
                                ${transaction.id}
                            </span>

                        </div>

                    </div>

                </td>


                <td>
                    ${transaction.category}
                </td>


                <td>
                    ${formatDate(
                        transaction.date
                    )}
                </td>


                <td>

                    <span class="
                        type-badge
                        ${transaction.type === "income"
                            ? "income-badge"
                            : "expense-badge"}
                    ">
                        ${transaction.type}
                    </span>

                </td>


                <td class="
                    ${transaction.type === "income"
                        ? "income-text"
                        : "expense-text"}
                ">

                    ${transaction.type === "income"
                        ? "+"
                        : "-"}

                    ${formatCurrency(
                        transaction.amount
                    )}

                </td>


                <td>

                    <div class="table-actions">

                        <button
                            class="
                                action-btn
                                edit-transaction
                            "
                            data-id="${transaction.id}"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-pen
                                "
                            ></i>

                        </button>


                        <button
                            class="
                                action-btn
                                delete-btn
                                delete-transaction
                            "
                            data-id="${transaction.id}"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-trash
                                "
                            ></i>

                        </button>

                    </div>

                </td>

            </tr>

        `).join("");


    /* =====================================================
       EDIT TRANSACTION
    ===================================================== */

    document
        .querySelectorAll(
            ".edit-transaction"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const transaction =
                        transactions.find(
                            item =>
                                item.id ===
                                button.dataset.id
                        );


                    if (transaction) {

                        openTransactionModal(
                            transaction
                        );
                    }
                }
            );
        });


    /* =====================================================
       DELETE TRANSACTION
    ===================================================== */

    document
        .querySelectorAll(
            ".delete-transaction"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        confirm(
                            "Delete this transaction?"
                        );


                    if (!confirmed) return;


                    try {

                        await deleteTransaction(
                            button.dataset.id
                        );


                        transactions =
                            transactions.filter(
                                transaction =>
                                    transaction.id !==
                                    button.dataset.id
                            );


                        renderAll();


                        showToast(
                            "Transaction deleted.",
                            "info"
                        );


                    } catch (error) {

                        showToast(
                            error.message,
                            "error"
                        );
                    }
                }
            );
        });
}


/* =========================================================
   TRANSACTION FILTERS
========================================================= */

[
    "filterType",
    "filterCategory",
    "searchTransaction"
]
.forEach(id => {

    const element = $(id);


    if (element) {

        element.addEventListener(
            "input",
            renderTransactionsTable
        );


        element.addEventListener(
            "change",
            renderTransactionsTable
        );
    }
});


/* =========================================================
   CATEGORIES
========================================================= */

function renderCategories() {

    const container =
        $("categoriesGrid");


    if (!container) return;


    container.innerHTML =
        categories.map(category => {

            const spent =
                transactions
                    .filter(
                        transaction =>
                            transaction.type ===
                                "expense"
                            &&
                            transaction.category ===
                                category.name
                    )
                    .reduce(
                        (total, transaction) =>
                            total +
                            Number(
                                transaction.amount
                            ),
                        0
                    );


            return `

                <div class="category-card">

                    <div class="category-icon">
                        ${category.icon}
                    </div>


                    <div class="category-details">

                        <h3>
                            ${category.name}
                        </h3>

                        <p>
                            Total spent
                        </p>

                        <strong>
                            ${formatCurrency(
                                spent
                            )}
                        </strong>

                    </div>

                </div>

            `;

        }).join("");
}
/* =========================================================
   BUDGETS
========================================================= */

function getCategoryExpense(category) {

    return transactions
        .filter(
            transaction =>
                transaction.type === "expense" &&
                transaction.category === category
        )
        .reduce(
            (total, transaction) =>
                total +
                Number(
                    transaction.amount || 0
                ),
            0
        );
}


/* =========================================================
   RENDER BUDGETS
========================================================= */

function renderBudgets() {

    const container =
        $("budgetList");


    if (!container) {
        return;
    }


    if (budgetCategories.length === 0) {

        container.innerHTML = `
            <div class="empty-list">
                No budget categories available.
            </div>
        `;

        return;
    }


    container.innerHTML =
        budgetCategories.map(category => {

            const budget =
                Number(
                    budgets[category] || 0
                );


            const spent =
                getCategoryExpense(
                    category
                );


            const percentage =
                budget > 0
                    ? Math.min(
                        (spent / budget) * 100,
                        100
                    )
                    : 0;


            let statusClass =
                "safe";


            if (
                budget > 0 &&
                spent >= budget
            ) {

                statusClass =
                    "danger";

            } else if (
                budget > 0 &&
                spent >= budget * 0.8
            ) {

                statusClass =
                    "warning";
            }


            return `

                <div class="budget-card">

                    <div class="budget-card-header">

                        <div>

                            <h3>
                                ${getCategoryIcon(category)}
                                ${category}
                            </h3>

                            <span>
                                ${formatCurrency(spent)}
                                spent
                            </span>

                        </div>


                        <button
                            class="edit-budget-btn"
                            data-category="${category}"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                    </div>


                    <div class="budget-progress-info">

                        <span>
                            ${Math.round(percentage)}%
                        </span>

                        <span>
                            Budget:
                            ${formatCurrency(budget)}
                        </span>

                    </div>


                    <div class="budget-progress">

                        <div
                            class="
                                budget-progress-fill
                                ${statusClass}
                            "
                            style="
                                width: ${percentage}%
                            "
                        ></div>

                    </div>


                    <div class="budget-card-footer">

                        <span>
                            Remaining:
                        </span>

                        <strong>
                            ${formatCurrency(
                                Math.max(
                                    budget - spent,
                                    0
                                )
                            )}
                        </strong>

                    </div>

                </div>

            `;

        }).join("");


    document
        .querySelectorAll(
            ".edit-budget-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openBudgetModal(
                        button.dataset.category
                    );
                }
            );
        });
}


/* =========================================================
   BUDGET MODAL
========================================================= */

let selectedBudgetCategory =
    null;


function openBudgetModal(category) {

    selectedBudgetCategory =
        category;


    const modal =
        $("budgetModal");


    if (!modal) {

        // If your HTML doesn't have a budget modal,
        // use a browser prompt.

        const currentBudget =
            budgets[category] || 0;


        const value =
            prompt(
                `Enter budget for ${category}:`,
                currentBudget
            );


        if (
            value !== null &&
            value !== ""
        ) {

            saveBudget(
                category,
                Number(value)
            );
        }

        return;
    }


    modal.classList.remove(
        "hidden"
    );


    if ($("budgetModalTitle")) {

        $("budgetModalTitle").textContent =
            `Set Budget - ${category}`;
    }


    if ($("budgetCategoryName")) {

        $("budgetCategoryName").textContent =
            category;
    }


    if ($("budgetAmount")) {

        $("budgetAmount").value =
            budgets[category] || "";
    }
}


function closeBudgetModal() {

    $("budgetModal")
        ?.classList.add("hidden");


    selectedBudgetCategory =
        null;


    $("budgetForm")
        ?.reset();
}


async function saveBudget(
    category,
    amount
) {

    if (
        !Number.isFinite(amount) ||
        amount < 0
    ) {

        showToast(
            "Please enter a valid budget amount.",
            "error"
        );

        return;
    }


    budgets[category] =
        amount;


    try {

        await saveBudgetsToBackend();


        renderBudgets();


        showToast(
            "Budget saved successfully."
        );


    } catch (error) {

        console.error(
            "Budget save error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save budget.",
            "error"
        );
    }
}


/* =========================================================
   BUDGET FORM
========================================================= */

on(
    "budgetForm",
    "submit",
    async event => {

        event.preventDefault();


        if (!selectedBudgetCategory) {

            return;
        }


        const amount =
            Number(
                $("budgetAmount")?.value
            );


        await saveBudget(
            selectedBudgetCategory,
            amount
        );


        closeBudgetModal();
    }
);


on(
    "closeBudgetModal",
    "click",
    closeBudgetModal
);


on(
    "cancelBudgetBtn",
    "click",
    closeBudgetModal
);


/* =========================================================
   BUDGET SUMMARY
========================================================= */

function renderBudgetSummary() {

    const container =
        $("budgetSummary");


    if (!container) {
        return;
    }


    const totalBudget =
        Object.values(budgets)
            .reduce(
                (total, amount) =>
                    total +
                    Number(amount || 0),
                0
            );


    const totalSpent =
        transactions
            .filter(
                transaction =>
                    transaction.type === "expense"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    Number(
                        transaction.amount || 0
                    ),
                0
            );


    const remaining =
        totalBudget -
        totalSpent;


    container.innerHTML = `

        <div class="budget-summary-card">

            <div>
                <span>Total Budget</span>

                <strong>
                    ${formatCurrency(totalBudget)}
                </strong>
            </div>

        </div>


        <div class="budget-summary-card">

            <div>
                <span>Total Spent</span>

                <strong>
                    ${formatCurrency(totalSpent)}
                </strong>
            </div>

        </div>


        <div class="budget-summary-card">

            <div>
                <span>Remaining</span>

                <strong>
                    ${formatCurrency(
                        remaining
                    )}
                </strong>
            </div>

        </div>

    `;
}


/* =========================================================
   ANALYTICS
========================================================= */

function getMonthlyTransactions() {

    const monthlyData = {};


    transactions.forEach(
        transaction => {

            if (!transaction.date) {
                return;
            }


            const date =
                new Date(
                    transaction.date
                );


            if (isNaN(date)) {
                return;
            }


            const month =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );


            if (!monthlyData[month]) {

                monthlyData[month] = {

                    income: 0,

                    expense: 0
                };
            }


            if (
                transaction.type === "income"
            ) {

                monthlyData[month].income +=
                    Number(
                        transaction.amount || 0
                    );

            } else {

                monthlyData[month].expense +=
                    Number(
                        transaction.amount || 0
                    );
            }
        }
    );


    return monthlyData;
}


/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

function renderAnalyticsSummary() {

    const totals =
        getFinanceTotals();


    if ($("analyticsIncome")) {

        $("analyticsIncome").textContent =
            formatCurrency(
                totals.income
            );
    }


    if ($("analyticsExpense")) {

        $("analyticsExpense").textContent =
            formatCurrency(
                totals.expenses
            );
    }


    if ($("analyticsSavings")) {

        $("analyticsSavings").textContent =
            formatCurrency(
                totals.savings
            );
    }
}


/* =========================================================
   ANALYTICS EXPENSE CHART
========================================================= */

function renderAnalyticsExpenseChart() {

    if (
        typeof Chart === "undefined" ||
        !$("analyticsExpenseChart")
    ) {
        return;
    }


    const categoryTotals = {};


    transactions
        .filter(
            transaction =>
                transaction.type === "expense"
        )
        .forEach(
            transaction => {

                categoryTotals[
                    transaction.category
                ] =
                    (
                        categoryTotals[
                            transaction.category
                        ] || 0
                    )
                    +
                    Number(
                        transaction.amount || 0
                    );
            }
        );


    if (analyticsExpenseChart) {

        analyticsExpenseChart.destroy();
    }


    analyticsExpenseChart =
        new Chart(
            $("analyticsExpenseChart"),
            {

                type: "bar",

                data: {

                    labels:
                        Object.keys(
                            categoryTotals
                        ),

                    datasets: [

                        {

                            label:
                                "Expenses",

                            data:
                                Object.values(
                                    categoryTotals
                                ),

                            borderRadius: 10,

                            backgroundColor:
                                "#ed8dae"
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    }
                }
            }
        );
}


/* =========================================================
   ANALYTICS INCOME VS EXPENSE CHART
========================================================= */

function renderAnalyticsIncomeChart() {

    if (
        typeof Chart === "undefined" ||
        !$("analyticsIncomeChart")
    ) {
        return;
    }


    const monthlyData =
        getMonthlyTransactions();


    const labels =
        Object.keys(
            monthlyData
        );


    const incomeData =
        labels.map(
            month =>
                monthlyData[month]
                    .income
        );


    const expenseData =
        labels.map(
            month =>
                monthlyData[month]
                    .expense
        );


    if (analyticsIncomeChart) {

        analyticsIncomeChart.destroy();
    }


    analyticsIncomeChart =
        new Chart(
            $("analyticsIncomeChart"),
            {

                type: "line",

                data: {

                    labels,

                    datasets: [

                        {

                            label:
                                "Income",

                            data:
                                incomeData,

                            borderColor:
                                "#55c7a2",

                            backgroundColor:
                                "rgba(85,199,162,0.15)",

                            tension: 0.4,

                            fill: true
                        },


                        {

                            label:
                                "Expenses",

                            data:
                                expenseData,

                            borderColor:
                                "#ed8dae",

                            backgroundColor:
                                "rgba(237,141,174,0.15)",

                            tension: 0.4,

                            fill: true
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"
                        }
                    }
                }
            }
        );
}


/* =========================================================
   RENDER ANALYTICS
========================================================= */

function renderAnalytics() {

    renderAnalyticsSummary();

    renderAnalyticsExpenseChart();

    renderAnalyticsIncomeChart();
}
/* =========================================================
   ANALYTICS CHARTS
========================================================= */

function renderAnalyticsCharts() {

    if (
        typeof Chart === "undefined"
    ) {
        return;
    }


    const expenses =
        transactions.filter(
            transaction =>
                transaction.type ===
                "expense"
        );


    const categoryTotals = {};


    expenses.forEach(transaction => {

        categoryTotals[
            transaction.category
        ] =
            (
                categoryTotals[
                    transaction.category
                ] || 0
            )
            +
            Number(
                transaction.amount
            );
    });


    /* EXPENSE ANALYTICS */

    if ($("analyticsExpenseChart")) {

        if (analyticsExpenseChart) {

            analyticsExpenseChart.destroy();
        }


        analyticsExpenseChart =
            new Chart(
                $("analyticsExpenseChart"),
                {

                    type: "doughnut",

                    data: {

                        labels:
                            Object.keys(
                                categoryTotals
                            ),

                        datasets: [

                            {

                                data:
                                    Object.values(
                                        categoryTotals
                                    ),

                                backgroundColor: [
                                    "#7464e8",
                                    "#55c7a2",
                                    "#ed8dae",
                                    "#e8b94f",
                                    "#6ea9e9",
                                    "#ff9f7e",
                                    "#b58ce8"
                                ],

                                borderWidth: 0
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        plugins: {

                            legend: {

                                position: "bottom"
                            }
                        }
                    }
                }
            );
    }


    /* INCOME ANALYTICS */

    if ($("analyticsIncomeChart")) {

        const totals =
            getFinanceTotals();


        if (analyticsIncomeChart) {

            analyticsIncomeChart.destroy();
        }


        analyticsIncomeChart =
            new Chart(
                $("analyticsIncomeChart"),
                {

                    type: "bar",

                    data: {

                        labels: [
                            "Income",
                            "Expenses",
                            "Savings"
                        ],

                        datasets: [

                            {

                                data: [

                                    totals.income,

                                    totals.expenses,

                                    Math.max(
                                        totals.savings,
                                        0
                                    )
                                ],

                                backgroundColor: [

                                    "#55c7a2",

                                    "#ed8dae",

                                    "#7464e8"
                                ],

                                borderRadius: 12
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        plugins: {

                            legend: {
                                display: false
                            }
                        }
                    }
                }
            );
    }
}


/* =========================================================
   INVOICE FILE HANDLING
========================================================= */

on(
    "browseInvoiceBtn",
    "click",
    () => $("invoiceFile")?.click()
);


on(
    "invoiceFile",
    "change",
    event => {

        handleInvoiceFile(
            event.target.files[0]
        );
    }
);


function handleInvoiceFile(file) {

    if (!file) return;


    const allowedTypes = [

        "application/pdf",

        "image/jpeg",

        "image/png"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showToast(
            "Please upload PDF, JPG, JPEG or PNG.",
            "error"
        );

        return;
    }


    selectedInvoiceFile = file;


    $("uploadPlaceholder")
        ?.classList.add("hidden");


    $("uploadPreview")
        ?.classList.remove("hidden");


    if ($("uploadedFileName")) {

        $("uploadedFileName").textContent =
            file.name;
    }


    if (
        file.type.startsWith(
            "image/"
        )
    ) {

        const reader =
            new FileReader();


        reader.onload =
            event => {

                if ($("invoiceImagePreview")) {

                    $("invoiceImagePreview").src =
                        event.target.result;


                    $("invoiceImagePreview")
                        .classList.remove(
                            "hidden"
                        );
                }
            };


        reader.readAsDataURL(
            file
        );

    } else {

        $("invoiceImagePreview")
            ?.classList.add("hidden");
    }


    showToast(
        "Invoice selected successfully."
    );
}


/* =========================================================
   DRAG AND DROP
========================================================= */

const dropZone =
    $("dropZone");


if (dropZone) {

    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            dropZone.classList.add(
                "drag-over"
            );
        }
    );


    dropZone.addEventListener(
        "dragleave",
        () => {

            dropZone.classList.remove(
                "drag-over"
            );
        }
    );


    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            dropZone.classList.remove(
                "drag-over"
            );


            handleInvoiceFile(
                event.dataTransfer.files[0]
            );
        }
    );
}


/* =========================================================
   ADD INVOICE AS EXPENSE
========================================================= */

on(
    "invoiceForm",
    "submit",
    async event => {

        event.preventDefault();


        const merchant =
            $("invoiceMerchant")
                .value
                .trim();


        const amount =
            Number(
                $("invoiceAmount")
                    .value
            );


        const date =
            $("invoiceDate")
                .value;


        const category =
            $("invoiceCategory")
                .value;


        if (
            !merchant ||
            !amount ||
            !date ||
            !category
        ) {

            showToast(
                "Please complete invoice details.",
                "error"
            );

            return;
        }


        try {

            const transactionData = {

                // Frontend uses lowercase.
                // createTransaction() automatically
                // converts this to "Expense" for backend.

                type: "expense",

                amount,

                category,

                date,

                description:
                    `Invoice - ${merchant}`
            };


            const created =
                await createTransaction(
                    transactionData
                );


            transactions.unshift(
                created
            );


            $("invoiceForm").reset();


            $("uploadPreview")
                ?.classList.add("hidden");


            $("uploadPlaceholder")
                ?.classList.remove("hidden");


            selectedInvoiceFile =
                null;


            renderAll();


            showToast(
                "Invoice added as expense successfully!"
            );


            switchSection(
                "dashboard"
            );


        } catch (error) {

            showToast(
                error.message,
                "error"
            );
        }
    }
);


/* =========================================================
   THEME
========================================================= */

function applyTheme(theme) {

    document.body.classList.toggle(
        "dark-theme",
        theme === "dark"
    );


    localStorage.setItem(
        "fintrack-theme",
        theme
    );


    $("lightThemeBtn")
        ?.classList.toggle(
            "active-theme",
            theme === "light"
        );


    $("darkThemeBtn")
        ?.classList.toggle(
            "active-theme",
            theme === "dark"
        );


    if ($("themeToggle")) {

        $("themeToggle").innerHTML =
            theme === "dark"
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
    }
}


on(
    "lightThemeBtn",
    "click",
    () => applyTheme("light")
);


on(
    "darkThemeBtn",
    "click",
    () => applyTheme("dark")
);


on(
    "themeToggle",
    "click",
    () => {

        const isDark =
            document.body.classList.contains(
                "dark-theme"
            );


        applyTheme(
            isDark
                ? "light"
                : "dark"
        );
    }
);


/* =========================================================
   CLEAR ALL DATA
========================================================= */

on(
    "clearDataBtn",
    "click",
    async () => {

        const confirmed =
            confirm(
                "Clear all transactions? This cannot be undone."
            );


        if (!confirmed) return;


        try {

            const deletePromises =
                transactions.map(
                    transaction =>
                        deleteTransaction(
                            transaction.id
                        )
                );


            await Promise.all(
                deletePromises
            );


            transactions = [];

            budgets = {};


            try {

                await saveBudgetsToBackend();

            } catch (error) {

                console.log(
                    "Budget clearing skipped"
                );
            }


            renderAll();


            showToast(
                "All finance data has been cleared.",
                "info"
            );


            switchSection(
                "dashboard"
            );


        } catch (error) {

            showToast(
                error.message,
                "error"
            );
        }
    }
);
/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    updateSummaryCards();

    renderExpenseChart();

    renderIncomeExpenseChart();

    renderRecentTransactions();
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    // Dashboard
    renderDashboard();


    // Transactions page
    renderTransactionsTable();


    // Categories
    renderCategories();


    // Budgets
    renderBudgets();

    renderBudgetSummary();


    // Analytics
    renderAnalytics();


    // Update user information
    updateUserUI();
}


/* =========================================================
   CLOSE MODALS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const transactionModal =
            $("transactionModal");


        if (
            transactionModal &&
            event.target === transactionModal
        ) {

            closeTransactionModal();
        }


        const budgetModal =
            $("budgetModal");


        if (
            budgetModal &&
            event.target === budgetModal
        ) {

            closeBudgetModal();
        }
    }
);


/* =========================================================
   SET DEFAULT DATES
========================================================= */

function setDefaultDates() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    if (
        $("transactionDate") &&
        !$("transactionDate").value
    ) {

        $("transactionDate").value =
            today;
    }


    if (
        $("invoiceDate") &&
        !$("invoiceDate").value
    ) {

        $("invoiceDate").value =
            today;
    }
}


/* =========================================================
   LOAD SAVED THEME
========================================================= */

function loadSavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "fintrack-theme"
        );


    if (savedTheme) {

        applyTheme(
            savedTheme
        );

        return;
    }


    // Default theme

    applyTheme(
        "light"
    );
}


/* =========================================================
   CHECK LOGIN STATUS
========================================================= */

async function checkAuthentication() {

    const token =
        getToken();


    if (!token) {

        showAuth();

        return;
    }


    try {

        // Try loading the current user

        await loadProfile();


        // Load all MongoDB data

        await Promise.all([
            loadTransactions(),
            loadBudgets()
        ]);


        showApp();


    } catch (error) {

        console.error(
            "Authentication check failed:",
            error
        );


        removeToken();

        removeCurrentUser();


        showAuth();
    }
}


/* =========================================================
   APPLICATION INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "FinTrack application starting..."
        );


        // Load saved user if available

        currentUser =
            getCurrentUser();


        // Populate all category dropdowns

        populateCategorySelects();


        // Set today's date

        setDefaultDates();


        // Load theme

        loadSavedTheme();


        // Show correct screen based on login

        await checkAuthentication();


        console.log(
            "FinTrack application loaded successfully."
        );
    }
);


/* =========================================================
   WINDOW ERROR HANDLER
========================================================= */

window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled error:",
            event.reason
        );
    }
);


/* =========================================================
   END OF APP.JS
========================================================= */