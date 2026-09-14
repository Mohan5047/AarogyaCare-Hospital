# 🏥 AarogyaCare GH - Government & General Hospital Appointment Booking System

A fullstack healthcare appointment booking web application built with **Node.js**, **Express**, and **SQLite**, customized with an **Indian Hospital context**, **Indian Rupees (₹)** currency, authentic medical qualifications (AIIMS, CMC, NIMHANS, PGIMER), and a **stylish medical light-green theme** with an animated splash loading screen. Designed for university mini projects and academic evaluations.

---

## 🌟 Key Features

1. **Department & Specialist Directory**:
   - 8 Medical Departments (Cardiology, Neurology, Pediatrics, Orthopedics, Dermatology, General Medicine, Ophthalmology, Dentistry).
   - Doctor profiles showcasing qualifications, years of experience, patient ratings, consultation fees, working days, and hours.
   - **All 28 States & 8 Union Territories of India Coverage**: Patients can book consultations by selecting their home state or local District GH hospital across India.

2. **Smart Appointment Booking Wizard**:
   - Department-based doctor filtering.
   - Dynamic 30-minute interval slot generation within doctor shift hours.
   - **Collision Prevention**: Real-time slot availability check prevents double booking.
   - Patient details capture (Name, Age, Gender, Phone, Email, Symptoms).
   - Generates unique reference tokens (e.g. `APT-2026-1001`).

3. **Official Printable Consultation Slip**:
   - Instant printable receipt modal with hospital branding, token, schedule, doctor details, and fees.
   - Supports direct browser printing (`window.print()`).

4. **Patient Portal (Self-Service)**:
   - Search booking history by registered Mobile Number or Reference Code.
   - Live status indicators (`Confirmed`, `Completed`, `Cancelled`).
   - Self-service appointment cancellation with instant slot release.

5. **Hospital Administration & Doctor Console**:
   - Real-time KPI metrics: Total Bookings, Today's Consultations, Confirmed, Completed, and Revenue ($).
   - Searchable and filterable appointments table (filter by date, status, doctor, or patient keyword).
   - Instant status updater (`Confirmed` ⇄ `Completed` ⇄ `Cancelled`).
   - "Add New Doctor" modal to dynamically add doctors without restarting the server.

---

## 🛠️ Technology Stack

- **Backend**: Node.js & Express.js REST API
- **Database**: SQLite (`hospital.db`) using Node's high-performance built-in SQLite engine (`node:sqlite`).
  - *No separate database server (MySQL/PostgreSQL/MongoDB) installation required!*
  - Automatically seeds default departments, doctors, and sample appointments on first boot.
- **Frontend**: Responsive Single-Page Application (HTML5, Modern CSS Design System, Vanilla ES6 JavaScript).
  - Clean healthcare UI with custom medical design tokens.
  - Toast notification system for non-blocking alerts.
  - Fully mobile and tablet responsive.

---

## 📁 Project Structure

```text
hospital-booking-system/
├── hospital.db                   # SQLite database (auto-generated on first launch)
├── package.json                  # Dependencies and scripts
├── server.js                     # Express server & API routes mount
├── README.md                     # Project documentation & viva guide
├── src/
│   ├── config/
│   │   └── database.js           # SQLite connection & schema DDL
│   ├── controllers/
│   │   ├── appointmentController.js # Booking logic & double-booking protection
│   │   ├── doctorController.js      # Doctor & slot generation logic
│   │   └── statsController.js       # Admin KPI calculations
│   ├── routes/
│   │   ├── appointmentRoutes.js     # /api/appointments routes
│   │   ├── doctorRoutes.js          # /api/doctors & /api/departments routes
│   │   └── statsRoutes.js           # /api/stats routes
│   └── seed/
│       └── seedData.js           # Pre-loaded doctors, departments & test bookings
└── public/
    ├── index.html                # Single Page Application
    ├── css/
    │   └── styles.css            # Responsive healthcare theme & print layout
    └── js/
        ├── app.js                # State management, navigation tabs & toasts
        ├── booking.js            # Booking wizard & dynamic time slot picker
        ├── patientPortal.js      # Patient lookup & cancellation
        └── adminDashboard.js     # Admin table, status updates & add doctor
```

---

## 🚀 How to Run the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (version 22.0.0 or higher recommended).

### Steps:
1. Open your terminal in the project directory:
   ```bash
   cd "hospital booking system"
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your web browser and navigate to:
   ```text
   http://localhost:5000
   ```

---

## 🗄️ Database Schema

### 1. `departments`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Unique department ID |
| `name` | TEXT NOT NULL UNIQUE | Department name (e.g., Cardiology) |
| `icon` | TEXT | Icon descriptor |
| `description` | TEXT | Department services summary |

### 2. `doctors`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Unique doctor ID |
| `department_id` | INTEGER NOT NULL | Foreign key to `departments(id)` |
| `name` | TEXT NOT NULL | Doctor full name |
| `specialty` | TEXT NOT NULL | Medical specialty |
| `qualification` | TEXT NOT NULL | Degrees (e.g., MD, FACC) |
| `experience_years`| INTEGER NOT NULL | Years of medical practice |
| `fee` | REAL NOT NULL | Consultation fee in USD |
| `rating` | REAL | Patient rating (out of 5.0) |
| `available_days` | TEXT NOT NULL | Active days (e.g., "Mon, Tue, Wed, Thu, Fri") |
| `time_start` | TEXT NOT NULL | Shift start (e.g., "09:00") |
| `time_end` | TEXT NOT NULL | Shift end (e.g., "16:00") |
| `email` | TEXT | Contact email |
| `phone` | TEXT | Contact phone |
| `avatar_url` | TEXT | Profile image URL |

### 3. `appointments`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Unique appointment ID |
| `reference_no` | TEXT NOT NULL UNIQUE | Unique tracking token (e.g., `APT-2026-1001`) |
| `doctor_id` | INTEGER NOT NULL | Foreign key to `doctors(id)` |
| `patient_name` | TEXT NOT NULL | Patient's full name |
| `patient_age` | INTEGER NOT NULL | Age in years |
| `patient_gender` | TEXT NOT NULL | Male / Female / Other |
| `patient_phone` | TEXT NOT NULL | Contact phone number |
| `patient_email` | TEXT NOT NULL | Confirmation email address |
| `appointment_date`| TEXT NOT NULL | Scheduled date (`YYYY-MM-DD`) |
| `appointment_time`| TEXT NOT NULL | Scheduled slot (e.g. `10:30 AM`) |
| `symptoms` | TEXT | Symptoms / consultation notes |
| `status` | TEXT NOT NULL | `Confirmed` / `Completed` / `Cancelled` |
| `created_at` | TEXT NOT NULL | Timestamp of booking creation |

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service healthcheck & timestamp |
| `GET` | `/api/departments` | List all medical departments |
| `GET` | `/api/doctors` | List doctors (supports `?department_id=` and `?search=`) |
| `GET` | `/api/doctors/:id` | Get specific doctor profile |
| `GET` | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Calculate open and booked 30-min slots |
| `POST` | `/api/doctors` | Register new doctor (admin) |
| `POST` | `/api/appointments` | Book new appointment with collision verification |
| `GET` | `/api/appointments` | Admin list with filters (`date`, `status`, `doctor_id`, `search`) |
| `GET` | `/api/appointments/lookup?query=...` | Patient lookup by phone or reference number |
| `PATCH`| `/api/appointments/:id/status` | Update status (`Confirmed`, `Completed`, `Cancelled`) |
| `DELETE`| `/api/appointments/:id` | Cancel appointment and free slot |
| `GET` | `/api/stats` | Hospital KPI metrics & revenue calculations |

---

## 🎓 Viva & Project Presentation Guide

If demonstrating this project for academic evaluation or viva:
1. **Explain the Architecture**:
   - It follows the **MVC (Model-View-Controller)** pattern.
   - Database queries are parameterized to prevent SQL Injection.
   - RESTful endpoints return standardized JSON structures `{ success: true, data: ... }`.
2. **Double-Booking Prevention**:
   - Explain how the application checks the database for existing non-cancelled bookings matching the exact `doctor_id`, `appointment_date`, and `appointment_time` before confirming. If found, an HTTP 409 (Conflict) response is triggered.
3. **Database Choice (SQLite)**:
   - ACID compliant, serverless, zero-configuration, and highly portable. The database file `hospital.db` lives directly inside the project and auto-initializes.
4. **Clean User Experience**:
   - Explain how client-side state dynamically switches tabs without page reloads (SPA), giving instant feedback with toast alerts and responsive modal receipts.
