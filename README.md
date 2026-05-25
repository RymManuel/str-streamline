# STR-Streamline — Capstone Financial Analytics Platform

Short-term rental (STR) financial analytics with a **React** frontend, **Express** API, and **MySQL** database. No demo accounts — you create the first administrator during setup.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui, Recharts |
| API | Node.js, Express, JWT, bcrypt |
| Database | MySQL 8+ (`str_streamline`) |

## Prerequisites

- **Node.js** 18+
- **MySQL** 8+ (XAMPP, WAMP, or standalone MySQL Server)
- **npm**

## Quick start

### 1. Install dependencies

```powershell
cd analytics-financial-secure
npm install
cd server
npm install
cd ..
```

### 2. Configure MySQL

Copy the server environment file and edit your MySQL password:

```powershell
copy server\.env.example server\.env
```

Edit `server/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=str_streamline
JWT_SECRET=use-a-long-random-string-here
```

### 3. Create the database

```powershell
npm run db:init
```

This runs `database/schema.sql` and creates all tables (users, rental_records, activity_logs, properties, financial_targets, etc.).

### 4. Start the application

```powershell
npm run dev:all
```

- **Frontend:** http://localhost:8080  
- **API:** http://localhost:3001  

### 5. Create your administrator account

**Option A — Browser (first launch)**  
Open http://localhost:8080. If no users exist, you will see **Administrator Registration**. Fill in name, email, and a strong password.

**Option B — Command line**

```powershell
npm run admin:create -- --name "Capstone Admin" --email admin@school.edu --password "SecurePass123!"
```

Password rules: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number.

Then sign in at http://localhost:8080 with that email and password.

### 6. Create additional users (admin only)

After logging in as admin: **User Management → Add User**. Assign role `user` or `admin`.

## Viewing the database

Use any MySQL client:

- **MySQL Workbench** — connect to `127.0.0.1`, database `str_streamline`
- **phpMyAdmin** (XAMPP) — http://localhost/phpmyadmin
- **CLI:**

```powershell
mysql -u root -p str_streamline
```

```sql
SHOW TABLES;
SELECT id, name, email, role, status FROM users;
SELECT COUNT(*) FROM rental_records;
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 20;
```

## Capstone features

| Feature | Description |
|---------|-------------|
| MySQL persistence | All users, CSV imports, logs, and reports stored in MySQL |
| Secure auth | bcrypt password hashing, JWT sessions, rate-limited login |
| First-time setup | No hardcoded demo users |
| CSV import | Auto-detect columns from Airbnb / VRBO / Booking.com exports |
| Dashboard & analytics | Revenue, occupancy, source breakdown, date filters |
| Financial reports | KPI summary, monthly targets, CSV export |
| Property portfolio | Register and manage rental properties |
| User management | Admin CRUD for accounts and roles |
| Activity audit log | LOGIN, UPLOAD, USER_CREATE, etc. with IP addresses |
| Profile & password | Users can update name and change password |
| API health indicator | Top bar shows MySQL connection status |

## Project structure

```
analytics-financial-secure/
├── database/schema.sql      # MySQL schema
├── server/                  # Express API
│   ├── src/routes/          # REST endpoints
│   ├── scripts/             # db:init, create-admin
│   └── .env                 # DB credentials (create from .env.example)
├── src/                     # React frontend
│   ├── components/str/      # App pages
│   ├── contexts/            # Auth
│   ├── hooks/               # React Query data hooks
│   └── lib/api.ts           # API client
└── README.md
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server + DB status |
| GET | `/api/auth/setup-status` | `{ needsSetup: true/false }` |
| POST | `/api/auth/setup-admin` | Create first admin |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/users` | User management (admin) |
| POST | `/api/files/upload` | Import CSV records |
| GET | `/api/analytics` | Records by date range |
| GET | `/api/reports/summary` | Financial report |
| GET | `/api/logs` | Audit log (admin) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start API + frontend together |
| `npm run dev` | Frontend only |
| `npm run dev:server` | API only |
| `npm run db:init` | Apply MySQL schema |
| `npm run admin:create` | CLI admin account |
| `npm run build` | Production frontend build |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MySQL Offline in UI | Start MySQL service; check `server/.env` credentials |
| `ECONNREFUSED` on login | Run `npm run dev:server` or `npm run dev:all` |
| Setup page won't submit | Run `npm run db:init` first |
| Port 8080 in use | Change port in `vite.config.ts` |

## Security notes (for defense / documentation)

- Passwords hashed with **bcrypt** (12 rounds) — never stored in plain text
- **JWT** tokens with configurable secret and 2-hour expiry
- **Parameterized SQL** queries (mysql2) — SQL injection mitigation
- Input sanitization on API and client
- Role-based access: admin vs user data scoping
- Rate limiting on authentication routes

## License

Capstone / academic use — STR-Streamline © 2026
