# Dental Management System

A comprehensive, multi-platform Dental Management System designed to streamline dental clinic operations. This project is structured as a monorepo containing a backend API, patient/customer portal, and administrative dashboard.

The system helps manage appointments, patient records, authentication, clinic workflows, and administrative tasks efficiently.

---

### Backend

`backend/`

- Node.js & Express API
- MongoDB database integration
- Authentication and API services
- File upload management

### Frontend

`frontend/`

- Patient/customer-facing application
- Appointment and user interaction features

### Admin

`admin/`

- Administrative dashboard
- Clinic staff and doctor management tools

---

# 🛠️ Tech Stack

## Backend API

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Token (JWT)
- **File Upload:** Multer
- **Cloud Storage:** Cloudinary

---

## Frontend & Admin

- **Framework:** React.js / Flutter *(update based on your implementation)*

---

# 📦 Getting Started

Follow these steps to set up the project locally.

---

## Prerequisites

Make sure you have installed:

- Node.js (v18 or higher)
- Git
- MongoDB or MongoDB Atlas account
- VS Code or preferred IDE

---

# 💻 Local Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/missdott/Dental-System.git
```

Navigate into the project:

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
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm run dev
```

or:

```bash
node server.js
```

---

# 3. Frontend Setup

Open another terminal.

Go back to the project root:

```bash
cd Dental-System
```

Enter the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm start
```

---

# 4. Admin Dashboard Setup

Open another terminal.

Go to the admin folder:

```bash
cd Dental-System/admin
```

Install dependencies:

```bash
npm install
```

Run the admin dashboard:

```bash
npm start
```

---

# 🚀 Features

## Appointment Management

- Create and manage dental appointments
- Schedule tracking
- Patient visit management

## Patient Management

- Patient profiles
- Dental history records
- Treatment information

## Authentication

- Secure login system
- Role-based access control
- Protected routes

## Administration

- Clinic management tools
- Doctor and staff dashboard
- Organized workflow management
