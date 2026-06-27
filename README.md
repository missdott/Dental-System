# Dental Management System

A comprehensive, multi-platform Dental Management System designed to streamline dental clinic operations. This project contains a patient portal, backend API, and administrative dashboard to improve appointment management, patient records, and clinic workflows.

---

# 🖥️ Frontend

The frontend serves as the main user-facing application for patients/customers.

### Responsibilities

- Patient registration and authentication
- Appointment scheduling and management
- Viewing dental records and treatment information
- User-friendly interface for clinic services

### Technologies

- React.js / Flutter *(update based on your implementation)*

---

# ⚙️ Backend

The backend provides the API services and handles the core system logic.

### Responsibilities

- API management
- Database operations
- Authentication and authorization
- File upload handling
- Communication between frontend and database

### Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose

### Additional Services

- JWT Authentication
- Multer for file uploads
- Cloudinary for cloud storage

---

# 🛠️ Admin Dashboard

The admin panel is designed for clinic staff and doctors to manage system operations.

### Responsibilities

- Manage patient information
- Manage appointments
- Monitor clinic activities
- Handle administrative tasks
- Control user access and permissions

### Technologies

- React.js / Flutter *(update based on your implementation)*

---

# 🚀 Features

## 📅 Appointment Management

- Create, update, and manage dental appointments
- Appointment scheduling system
- Track patient visits and schedules

## 👥 Patient Management

- Patient profiles
- Dental history records
- Treatment information management
- Organized patient data storage

## 🔐 Authentication & Security

- Secure login system
- JWT-based authentication
- Protected routes
- Role-based access control

## 💼 Clinic Administration

- Doctor and staff management
- Administrative dashboard
- Clinic workflow management

---

# 🛠️ Tech Stack

## Frontend

- React.js / Flutter

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JSON Web Token (JWT)

## File Management

- Multer
- Cloudinary

---

# 📦 Local Installation & Setup

Follow these steps to run the project locally.

---

## Prerequisites

Make sure you have installed:

- Node.js (v18 or higher)
- Git
- MongoDB or MongoDB Atlas
- Visual Studio Code

---

# 1. Clone the Repository

```bash
git clone https://github.com/your-username/Dental-System.git
```

Navigate to the project folder:

```bash
cd Dental-System
```

---

# 2. Backend Setup

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

JWT_SECRET=your_jwt_secret
```

Run the backend server:

```bash
npm run dev
```

---

# 3. Frontend Setup

Open a new terminal.

Go back to the project folder:

```bash
cd Dental-System
```

Enter frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm start
```

---

# 4. Admin Setup

Open another terminal.

Go to admin folder:

```bash
cd Dental-System/admin
```

Install dependencies:

```bash
npm install
```

Run admin dashboard:

```bash
npm start
```