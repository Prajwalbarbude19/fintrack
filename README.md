

# 💰 FinTrack – Personal Finance Tracker

FinTrack is a full-stack personal finance management web application that helps users track their income, expenses, budgets, invoices, and financial analytics in one place.

The application provides secure user authentication and allows users to manage their financial activities through an easy-to-use dashboard.



## ✨ Features

- 🔐 User Registration and Login
- 🔒 JWT-based Authentication
- 💰 Track Income and Expenses
- 📊 Financial Dashboard
- 📈 Financial Analytics
- 💵 Budget Management
- 🧾 Invoice Management
- 📤 Invoice Upload Functionality
- 🗑️ Delete Transactions and Invoices
- 👤 User Profile Management
- 🌐 Full-stack deployment using Render
- ☁️ MongoDB Atlas database integration

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JSON Web Token (JWT)
- bcrypt.js

### Other Technologies

- Multer for file uploads
- CORS
- dotenv

### Deployment

- Render – Frontend and Backend Hosting
- MongoDB Atlas – Cloud Database

---

## 📁 Project Structure

```text
fintrack/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── budgetController.js
│   │   ├── invoiceController.js
│   │   ├── transactionController.js
│   │   └── userController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── Budget.js
│   │   ├── Invoice.js
│   │   ├── Transaction.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── uploads/
│   ├── package.json
│   └── server.js
│
├── index.html
├── app.js
├── style.css
├── package.json
└── README.md
```

---

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Prajwalbarbude19/fintrack.git
```

### 2. Navigate to the Project

```bash
cd fintrack
```

---

## 🔧 Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend folder:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=http://127.0.0.1:5500
```

Start the backend server:

```bash
node server.js
```

The backend will run on:

```text
http://localhost:5000
```

---

## 💻 Frontend Setup

Open the project frontend using a local development server such as Live Server.

Update the API URL in your frontend configuration if required:

```javascript
const API_URL = "http://localhost:5000";
```

For production deployment, use:

```javascript
const API_URL = "https://fintrack-s4wx.onrender.com";
```

---

## ☁️ Deployment

The project is deployed using **Render**.

### Frontend

The frontend is deployed as a **Render Static Site**.

🌐 https://fintrack-1-bdg8.onrender.com

### Backend

The backend is deployed as a **Render Web Service**.

⚙️ https://fintrack-s4wx.onrender.com

### Database

The application uses **MongoDB Atlas** as its cloud database.

---

## 🔐 Environment Variables

The backend requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used for JWT authentication |
| `JWT_EXPIRE` | JWT token expiration time |
| `CLIENT_URL` | URL of the deployed frontend |

Example production configuration:

```env
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLIENT_URL=https://fintrack-1-bdg8.onrender.com
```

⚠️ **Never upload your `.env` file or secret keys to GitHub.**

---

## 📊 Main Functionalities

### 🔐 Authentication

Users can:

- Create a new account
- Login securely
- Access protected features
- Authenticate using JWT tokens

### 💸 Transaction Management

Users can:

- Add income
- Add expenses
- View transactions
- Delete transactions

### 💰 Budget Management

Users can:

- Create budgets
- Track spending
- Manage financial limits

### 🧾 Invoice Management

Users can:

- Create and manage invoices
- Upload invoice files
- Convert invoice expenses into financial records

### 📈 Analytics

The application provides financial insights to help users understand:

- Income
- Expenses
- Spending patterns
- Overall financial activity

---

## 🔒 Security

FinTrack includes:

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Environment variables for sensitive information
- CORS configuration

---

## 🚀 Future Improvements

Possible future enhancements include:

- 📱 Improved mobile responsiveness
- 📊 Advanced financial charts
- 🔔 Budget limit notifications
- 📧 Email notifications
- 🌙 Dark mode
- 📥 Export financial reports as PDF/Excel
- 🔄 Recurring transactions
- 💳 Multiple account management

---

## 👨‍💻 Author

**Prajwal Barbude**

---

## 📄 License

This project is created for educational and personal use.

---

## ⭐ Support

If you like this project, please consider giving it a ⭐ on GitHub!
```

