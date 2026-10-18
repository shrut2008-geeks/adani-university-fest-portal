# 🚀 AU Fest — Adani University Fest & Club Management Portal

A collegiate events and club management platform tailored for **"AU Fest"**, Adani University's annual tech and cultural fest. Built with a production-grade **Node.js + Express + PostgreSQL (pg)** backend and a **React (Vite) + Tailwind CSS** frontend.

---

## 🌌 Features Overview

- **Executive Fest Dashboard**: Real-time aggregate statistics for active clubs, committee members, fest events, and verified corporate sponsorships received.
- **Club Directory & Achievements**: Explore student societies and flagship fest committees with member counts, category filters, and recognized awards.
- **Committee & Membership Management**: Role-based access control with positions (*President*, *Vice-President*, *Member*).
- **Events & Zero-Gravity Schedule**: Comprehensive schedule with live venue capacity indicators, status badges (*Planned*, *Ongoing*, *Completed*), and date filters.
- **Event Dossier & Live Attendance**: Check-in mechanism with one-click attended status toggling for organizers.
- **Capacity-Aware Registrations**: Student registrations with duplicate-prevention and venue seat limits.
- **Sponsors & Payment Ledger**: Manage corporate sponsors, record funding disbursements (including University internal disbursements where `sponsor_id` is `NULL`), and track approval states (*Pending*, *Approved*, *Rejected*).
- **Attendee-Verified Feedback**: Rate events 1-5 stars with comments, strictly verified against recorded event attendance.
- **Fest Intelligence & GROUP BY Analytics**: Dedicated reports dashboard executing aggregate SQL queries for club memberships, total budgets, registration capacity fill rates, and average satisfaction ratings.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v18+ / v24+), Express.js, `pg` (PostgreSQL Connection Pool), JWT, `bcryptjs`, CORS, Dotenv |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Lucide Icons, React Router v6 |
| **Database** | PostgreSQL with native identity columns (`INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`) |
| **Security** | Role-based authorization (`admin`, `club_admin`, `student`), parameterized queries (`$1, $2`), token expiration |

---

## 📁 Project Architecture

```
adani-university-fest-portal/
├── server/
│   ├── db/
│   │   ├── index.js          # PostgreSQL Connection Pool & query helper
│   │   ├── schema.sql        # Exact DDL schema with IDENTITY PKs & FKs
│   │   ├── seed.sql          # Seed data with hashed passwords & fest records
│   │   └── seedRunner.js     # Node runner to initialize DB tables & data
│   ├── middleware/
│   │   ├── auth.js           # JWT verification & role authorization
│   │   └── errorHandler.js   # Centralized error handler (23503, 23505, 23514)
│   ├── routes/
│   │   ├── auth.js           # Login, register, current user profile
│   │   ├── dashboard.js      # Key fest statistics & live highlights
│   │   ├── clubs.js          # Club CRUD, categories, achievements
│   │   ├── members.js        # Club roster & executive positions
│   │   ├── events.js         # Event scheduling, venue joins, details
│   │   ├── venues.js         # Fest venues & capacities
│   │   ├── registrations.js  # Capacity-checked registrations & check-in
│   │   ├── organisers.js     # Event organising committee roles
│   │   ├── sponsors.js       # Sponsors & payment ledger
│   │   ├── feedback.js       # Attendance-gated reviews & ratings
│   │   └── reports.js        # GROUP BY analytical queries
│   ├── .env                  # Backend environment variables
│   ├── .env.example          # Template environment file
│   ├── index.js              # Express app bootstrap & route registration
│   └── package.json          # Server dependencies
│
├── client/
│   ├── public/
│   │   ├── logo.png          # Official Adani University / AU Fest logo
│   │   └── favicon.svg       # Fest favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Persistent navbar with dedicated logo.png
│   │   │   ├── StatCard.jsx        # Big bold metric cards with glows
│   │   │   ├── StatusBadge.jsx     # Color-coded badge pills
│   │   │   └── Modal.jsx           # Dark glassmorphic modal dialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT authentication & session state
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # Fest stats & upcoming spotlight
│   │   │   ├── ClubsPage.jsx       # Club directory & category filters
│   │   │   ├── ClubDetailPage.jsx  # Member roster & achievements
│   │   │   ├── EventsPage.jsx      # Events schedule & filters
│   │   │   ├── EventDetailPage.jsx # Check-ins, organisers, budget, reviews
│   │   │   ├── RegistrationsPage.jsx # Student passes & check-in roster
│   │   │   ├── SponsorsPage.jsx    # Corporate partners & ledger
│   │   │   ├── ReportsPage.jsx     # GROUP BY Intelligence analytics
│   │   │   └── LoginPage.jsx       # Space-age sign in with 1-click demo fill
│   │   ├── App.jsx                 # Routes & layout shell
│   │   ├── index.css               # Tailwind directives & zero-gravity effects
│   │   └── main.jsx                # React DOM entry
│   ├── index.html                  # HTML entry with Space Grotesk & Inter fonts
│   ├── tailwind.config.js          # Adani university official color tokens
│   ├── vite.config.js              # Vite server & API proxy config
│   ├── .env                        # Frontend environment variables
│   └── package.json                # Frontend dependencies
│
└── README.md                       # Comprehensive guide & documentation
```

---

## 🚀 Quick Setup & Installation Guide

### Step 1: Create the PostgreSQL Database
Make sure PostgreSQL is running on your machine (default port `5432`). In your PostgreSQL client (e.g. `psql`, pgAdmin, or terminal):

```sql
CREATE DATABASE au_fest;
```

---

### Step 2: Configure Environment Variables

#### Backend (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/au_fest
JWT_SECRET=your_super_secret_jwt_key_here
ALLOWED_ORIGIN=http://localhost:3000
ADMIN_SEED_PASSWORD=YOUR_ADMIN_PASSWORD
CLUBADMIN_SEED_PASSWORD=YOUR_CLUBADMIN_PASSWORD
```
*(Replace `postgres:YOUR_PASSWORD` with your PostgreSQL username and password. Set `ADMIN_SEED_PASSWORD` and `CLUBADMIN_SEED_PASSWORD` to your chosen administrative passwords).*

#### Frontend (`client/.env`)
Create or edit `client/.env`:
```env
VITE_API_URL=/api
```

---

### Step 3: Run Database Schema and Seed Data
Navigate to the `server/` directory and run:

```bash
cd server
npm install
npm run seed
```

This will automatically execute `server/db/schema.sql` (creating all 11 tables with proper foreign keys and constraints) followed by `server/db/seed.sql` (populating clubs, venues, fest events, sponsorships, and demo accounts). The seed runner dynamically hashes the `ADMIN_SEED_PASSWORD` and `CLUBADMIN_SEED_PASSWORD` configured in `server/.env`.

#### Default Pre-Configured Accounts:
- **Admin**: `admin@adani.ac.in` (Password set by the person installing the project in `server/.env` via `ADMIN_SEED_PASSWORD`)
- **Club Admin**: `clubadmin@adani.ac.in` (Password set by the person installing the project in `server/.env` via `CLUBADMIN_SEED_PASSWORD`)
- **Student**: `student@adani.ac.in` (Password: `adani123` — low-privilege demo account that cannot reach Reports, sponsorship payment amounts, or admin actions)

> **Note on Security:** Admin and Club Admin passwords are set by the person who installs the project in `server/.env`. They are hashed using bcrypt when running `npm run seed` and are never stored or exposed in the frontend code.

---

### Step 4: Run the Backend API Server
Inside the `server/` directory:

```bash
npm start
```
*The server will start at `http://localhost:5000`. Test the health endpoint at `http://localhost:5000/api/health`.*

---

### Step 5: Run the Frontend (React + Vite)
In a new terminal window, navigate to `client/`:

```bash
cd client
npm install
npm run dev
```
*The React app will launch at `http://localhost:3000` (or `http://localhost:5173`).*

---

## 🛡️ Business Rules & Access Control Matrix

| Action | Admin | Club Admin | Student |
| :--- | :---: | :---: | :---: |
| View Fest Dashboard, Events, Clubs | ✅ | ✅ | ✅ |
| View Analytical Reports (`/reports`) | ✅ | ❌ | ❌ |
| View Sponsorship Payments & Ledger Amounts | ✅ | ❌ | ❌ |
| Register for Available Events | ✅ | ✅ | ✅ |
| Submit Event Feedback (if attended) | ✅ | ✅ | ✅ |
| Create / Edit Events | ✅ | ✅ (Own Club Only) | ❌ |
| Manage Club Members & Positions | ✅ | ✅ (Own Club Only) | ❌ |
| Toggle Registration Attendance (Check-in) | ✅ | ✅ (Own Club Events) | ❌ |
| Delete Clubs / Venues | ✅ | ❌ | ❌ |

---

## 🎨 AU Fest UI Design Guide

The UI is built according to the official **AU Fest & Adani Branding Design Language**, combining high-tech clean aesthetics with official university corporate identity.

---

## 🎓 About AU Fest

**AU Fest** is Adani University's annual flagship fest uniting engineering, artificial intelligence, cultural arts, robotics, and entrepreneurship. Hosted annually at the Shantigram campus, Ahmedabad.
