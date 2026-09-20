# PlaySense — Stage 32 Security & Authentication Review

Stage 32 hardens the frontend authentication/session layer while keeping the
existing Bearer-token API contract from Stage 31.

## Files

Copy:

client/src/utils/auth.js
client/src/utils/authFetch.js
client/src/components/ProtectedRoute.jsx

## 1. Protected routes

The new ProtectedRoute checks:

- token exists
- JWT has a valid three-part structure
- JWT has an `exp` claim
- token is not expired
- invalid/expired local session is removed before redirect

It does NOT treat decoded JWT data as authorization. Authorization remains
the responsibility of the backend middleware.

## 2. Logout

Replace your current logout handler with:

import { logout } from "../utils/auth";

const handleLogout = () => {
  logout();
  navigate("/login", { replace: true });
};

## 3. Login/Register success

After a successful login or registration response:

import { saveAuth } from "../utils/auth";

saveAuth({
  token: data.token,
  user: data.user,
});

navigate("/", { replace: true });

Do not store passwords or raw authentication responses in localStorage.

## 4. Authenticated API requests

For new authenticated requests, use:

import { authFetch } from "../utils/authFetch";

const response = await authFetch("/matches");

For POST/PUT:

const response = await authFetch("/matches", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

The helper automatically adds the Bearer token and handles a 401 by clearing
the local session.

## 5. Existing Analytics/Dashboard code

Existing pages can continue using their current Authorization header.
Stage 32 does not require rewriting Analytics.jsx.

For future cleanup, migrate authenticated fetch calls to authFetch so session
handling stays consistent.

## 6. Important security boundary

The browser cannot safely keep a JWT secret. The JWT signature is verified
only by the backend.

The frontend expiration check is only a UX/session check. It is not an
authorization mechanism.

## 7. Current architecture note

Stage 32 retains localStorage because the existing PlaySense architecture uses
Bearer tokens in the Authorization header.

For a higher-security production deployment, the next security iteration can
move authentication to Secure + HttpOnly + SameSite cookies. That requires a
coordinated backend/frontend authentication change and should not be mixed
into this stage.

## 8. Manual security test

1. Login normally.
2. Open DevTools > Application > Local Storage.
3. Confirm only playsense_token and playsense_user are used by auth.
4. Confirm no password is stored.
5. Logout.
6. Confirm the token and user are removed.
7. Open a protected route after logout.
8. Confirm it redirects to /login.
9. Temporarily alter/remove the token.
10. Confirm the protected route rejects the session.
11. Call a protected API with an expired/invalid token.
12. Confirm the API returns 401 and the frontend returns to login.

## 9. Production reminder

Do not commit:

- server/.env
- JWT_SECRET
- MongoDB credentials
- API keys
- passwords

Use HTTPS in production.
