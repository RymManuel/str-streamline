# Administrator Account Guide

STR-Streamline does **not** ship with demo users. You must create at least one administrator before anyone can sign in.

## Method 1: Web setup (recommended)

1. Complete [README](../README.md) steps: MySQL running, `npm run db:init`, `npm run dev:all`.
2. Open http://localhost:8080.
3. Complete the **Administrator Registration** form.
4. You are signed in automatically as admin.

This form only appears when the `users` table is empty.

## Method 2: Command line

From the project root:

```powershell
npm run admin:create -- --name "Your Full Name" --email you@university.edu --password "MySecure99!"
```

Then open http://localhost:8080 and sign in.

## Password requirements

- At least 8 characters
- At least one uppercase letter (A–Z)
- At least one lowercase letter (a–z)
- At least one number (0–9)

## Creating regular users

1. Sign in as **admin**.
2. Go to **User Management**.
3. Click **Add User**.
4. Set role to **user** for property managers, or **admin** for co-administrators.

## Resetting if you forgot the admin password

Use MySQL Workbench or CLI to delete all users and run setup again:

```sql
USE str_streamline;
DELETE FROM activity_logs;
DELETE FROM rental_records;
DELETE FROM uploaded_files;
DELETE FROM properties;
DELETE FROM financial_targets;
DELETE FROM users;
```

Refresh http://localhost:8080 — the setup screen returns.

Or insert a new admin via CLI:

```powershell
npm run admin:create -- --name "New Admin" --email newadmin@school.edu --password "NewSecure99!"
```

## Verifying in MySQL

```sql
SELECT name, email, role, status, created_at FROM users;
```

You should see your admin row with `role = admin` and `status = active`.
