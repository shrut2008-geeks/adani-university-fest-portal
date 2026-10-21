# 🏛️ AU Fest — Adani University Club & Event Portal

**AU Fest** is the comprehensive event scheduling, club directory, student ticketing, and fest intelligence portal designed for **Adani University**. The platform manages student chapters, flagship committees, venue capacity limits, real-time ticket issuance, check-in rosters, attendance-verified reviews, and institutional analytics.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Lucide React icons, React Router v6.
- **Backend**: Node.js, Express.js, PostgreSQL client (`pg` connection pool), JSON Web Tokens (JWT), bcryptjs, CORS.
- **Database**: Serverless PostgreSQL (Neon).
- **Deployment**:
  - **Frontend**: Hosted on [Vercel](https://vercel.com/)
  - **Backend**: Hosted as a Web Service on [Render](https://render.com/)
  - **Database**: Managed on [Neon](https://neon.tech/)

---

## 📐 Architecture

```mermaid
flowchart LR
    Client["Client (React / Vite on Vercel)"] -->|HTTPS REST API / JWT| Server["Backend (Express.js on Render)"]
    Server -->|TLS Encrypted Connection Pool| DB[("Database (PostgreSQL on Neon)")]
    Server -.->|Async Non-blocking Alerts| Telegram["Telegram Alerts API (5s Timeout)"]
```

1. **Client (Vercel)**: Translucent, responsive SPA adhering to the Adani University purple brand system (`#74186E`), supporting dark/light mode, accessible modals, and URL-synchronized search filters.
2. **Backend (Render)**: Express REST API enforcing role-based access control, strict parameterized queries (`$1, $2, ...`), formula injection-safe CSV exports, and asynchronous 5-second timeout Telegram notifications.
3. **Database (Neon)**: Relational PostgreSQL schema with relational integrity constraints (`ON DELETE CASCADE / SET NULL`), venue seat limits, and attendance tracking.

---

## 📸 Screenshots

<!-- Placeholders for visual reference -->
| Dashboard Overview | Event Schedule & Capacity |
| :---: | :---: |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Events Schedule](docs/screenshots/events.png) |

| Student Event Passes & Roster | Fest Intelligence & Analytics |
| :---: | :---: |
| ![My Registrations](docs/screenshots/my_registrations.png) | ![Analytics Reports](docs/screenshots/analytics.png) |

---

## 👥 Roles & Permissions Matrix

All user roles are strictly derived from verified JWT tokens or database lookups; user role is **never** accepted from request bodies.

| Feature / Action | Student | Club Admin | Admin |
| :--- | :---: | :---: | :---: |
| Browse clubs, events, venues & ratings | ✅ | ✅ | ✅ |
| Register for events & reserve seat | ✅ | ✅ | ✅ |
| View own passes (`/my-registrations`) | ✅ | ✅ | ✅ |
| Cancel own registration (before event starts) | ✅ | ✅ | ✅ (Any time) |
| Submit event feedback (attendance-verified) | ✅ | ✅ | ✅ |
| Create / Edit / Delete events for assigned club | ❌ | ✅ | ✅ (All clubs) |
| Manage club details & achievements | ❌ | ✅ (Own club) | ✅ (All clubs) |
| Toggle attendee check-in (`Mark Attended`) | ❌ | ✅ (Own events) | ✅ (All events) |
| View full attendance roster (`/registrations`) | ❌ | ✅ | ✅ |
| Access fest intelligence reports (`/reports`) | ❌ | ❌ | ✅ |
| Export registrations roster as CSV | ❌ | ❌ | ✅ |
| Export analytics report as CSV | ❌ | ❌ | ✅ |
| Manage corporate sponsors & payment ledger | ❌ | ❌ | ✅ |

---

## ⚙️ Environment Variables

> [!IMPORTANT]
> Never commit actual secret keys, database credentials, or API tokens to source control. Refer to `server/.env.example` for template placeholders.

### Frontend (`client/.env`)
- `VITE_API_URL`: Base URL for the Express backend on Render (e.g. `https://au-fest-api.onrender.com` in production; omitted in local development to use the Vite dev proxy).

### Backend (`server/.env`)
- `PORT`: Port on which the Express server listens (defaults to `5000`).
- `DATABASE_URL`: Full PostgreSQL connection string with SSL configuration (e.g. `postgresql://user:password@ep-...neon.tech/neondb?sslmode=require`).
- `JWT_SECRET`: High-entropy secret key used to sign and verify JSON Web Tokens.
- `ALLOWED_ORIGIN`: Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173,https://your-frontend.vercel.app`).
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for real-time dispatch alerts.
- `TELEGRAM_CHAT_ID`: Target Telegram channel or chat ID.

---

## 💻 Local Setup & Development (Windows)

### Prerequisites
- **Node.js** (v18.x or v20+ / v24+)
- **Git for Windows**
- **npm** (bundled with Node.js)

### 1. Clone the Repository
```powershell
git clone https://github.com/your-username/adani-university-fest-portal.git
cd adani-university-fest-portal
```

### 2. Install Server Dependencies
```powershell
cd server
npm install
cd ..
```

### 3. Install Client Dependencies
```powershell
cd client
npm install
cd ..
```

### 4. Running the Application
> [!CAUTION]
> **Safety Rule**: If your local `server/.env` points to the **LIVE Neon Production Database**, **NEVER** run `npm run seed`, `seedRunner.js`, or any schema-altering script locally.
>
> To work on the frontend with the deployed backend or live API:
```powershell
cd client
npm run dev
```
The Vite development server will start at `http://localhost:5173`.

### 5. Running Code Verification Locally
Verify syntax and production bundle without touching the database:
```powershell
# Verify backend files syntax
node --check server/notify.js
node --check server/routes/registrations.js
node --check server/routes/events.js
node --check server/routes/reports.js

# Build client production bundle
cd client
npm run build
```

---

## 🗄️ Database Migrations

All database schema evolutions must be non-destructive:
1. Schema modifications are written into numbered migration scripts under `server/db/migrations/` (e.g. `001_create_example.sql`).
2. Migrations must **never DROP or DELETE** existing tables or live production data.
3. **Execution**:
   - Log in to the [Neon Console](https://console.neon.tech/).
   - Open the **SQL Editor** for the target database branch.
   - Paste and execute the SQL migration script manually.
   - Verify index creation and table constraints before deploying updated application code.

---

## ⚠️ Known Limitations & Deployment Notes

1. **Render Free-Tier Spin Down**:
   - The backend is deployed on Render's free tier, which enters a sleep state after **15 minutes of inactivity**.
   - The first HTTP request after a sleep period incurs a **30 to 50 second cold start** delay while the container spins up. The frontend includes automatic retry and loading states to handle this smoothly.
2. **Neon Serverless Suspension**:
   - Neon serverless PostgreSQL suspends compute instances after inactivity. First queries after suspension may experience a transient latency spike of 1–2 seconds.
3. **CSV Export Formula Injection Neutralization**:
   - All exported CSV cells starting with `=, +, -, @, \t, \r` are automatically prefixed with a single quote (`'`) to protect spreadsheet applications against formula execution exploits. Export files are encoded with UTF-8 BOM (`\uFEFF`) for immediate rendering in Microsoft Excel.
