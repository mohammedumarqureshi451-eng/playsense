# PlaySense — Stage 31 Backend Validation & API Hardening

This stage hardens the existing Node/Express/MongoDB backend without changing
the frontend analytics model.

## Replace these files

Copy these files into:

FSD_A060/server/

- server.js
- middleware/authMiddleware.js
- models/User.js
- models/Match.js
- routes/authRoutes.js
- routes/matchRoutes.js

Do not replace your existing `server/.env` with the example file.

## Environment

Make sure `server/.env` contains:

PORT=5000
MONGO_URI=your real MongoDB Atlas URI
JWT_SECRET=your private secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

## Stage 31 changes

- Added `/api/health`.
- Added centralized 404 handling.
- Added centralized API error handling.
- Restricted browser CORS to the configured frontend origin.
- Added JSON request size protection.
- Added stronger auth-token validation.
- Added expired-token handling.
- Added duplicate-email handling.
- Added normalized emails.
- Added password hashing with bcrypt.
- Added match payload validation before writes.
- Added numeric range validation.
- Added football relationship checks.
- Added user-scoped GET/PUT/DELETE queries.
- Added ObjectId validation before match lookup/update/delete.
- Added database and API startup diagnostics.
- Added Mongoose validation and useful API status codes.

## Quick test

From FSD_A060/server:

npm run dev

Then open:

http://localhost:5000/api/health

Expected shape:

{
  "ok": true,
  "service": "PlaySense API",
  "database": "connected"
}

If the database says "disconnected", check MONGO_URI first.

## Important

Keep JWT_SECRET private. Do not commit server/.env.
