# Invisphere Server — Quick Testing & Admin Seed

This file contains quick steps to run the server locally and smoke-test core authentication and admin flows.

Prerequisites
- Node.js (18+ recommended)
- npm
- If you want MongoDB mode: a MongoDB URI and env var `MONGO_URI`

Seeded admin
- Email: admin@x-fa.com
- Password: XFAadmin2026!
- You can override with environment variables: `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server.

Run server (development)
```powershell
cd server
npm install
npm run dev
```

If port 8080 is busy the server will bind to a random available port; check the logged "Invisphere API listening on port" line to find the active port.

Health check
```powershell
# Replace PORT with the actual server port shown in logs
Invoke-RestMethod -Uri "http://localhost:PORT/api/health" -Method Get
```

Auth flows (PowerShell examples)
```powershell
# Signup (new user)
Invoke-RestMethod -Uri "http://localhost:PORT/api/auth/signup" -Method Post -ContentType 'application/json' -Body '{"firstName":"Test","lastName":"User","email":"test1@local","password":"Abc!2345","country":"UK"}'

# Login (user)
Invoke-RestMethod -Uri "http://localhost:PORT/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"test1@local","password":"Abc!2345"}'

# Login (admin)
Invoke-RestMethod -Uri "http://localhost:PORT/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"admin@x-fa.com","password":"XFAadmin2026!"}'

# Fetch admin overview (use token returned from login)
# Example with token in header (PowerShell)
$headers = @{ Authorization = 'Bearer <TOKEN>' }
Invoke-RestMethod -Uri "http://localhost:PORT/api/admin/overview" -Method Get -Headers $headers

# Password reset request
Invoke-RestMethod -Uri "http://localhost:PORT/api/auth/password/forgot" -Method Post -ContentType 'application/json' -Body '{"email":"test1@local"}'
```

Notes & Known non-fatal issues
- The server attempts to refresh market data from CoinGecko periodically. If the environment has no external network or DNS (getaddrinfo ENOTFOUND), the refresh will fail but this is non-fatal. The app logs the failure and continues.
- In sample data mode (fallback when MongoDB is unavailable), password verification supports plain sample passwords for convenience. For production, always use MongoDB and hashed passwords.

If you hit any errors while running these steps, copy the terminal output and paste it into the project issues or share it back here so I can triage and fix the failure.
