# PlaySense — Stage 33
## API Client Centralization & Session Resilience

### Goal

Stage 33 creates one consistent frontend API layer for authenticated requests.

It adds:

- Central API base URL
- JWT/session validation before requests
- Automatic 401 session cleanup
- Session-expired event
- Request timeout handling
- Consistent JSON/text response parsing
- Structured API errors with `status` and `data`
- Network-error handling
- Reusable `apiGet`, `apiPost`, `apiPut`, and `apiDelete` helpers

### Files

Copy these into:

```text
client/src/utils/
```

Files:

```text
auth.js
authFetch.js
api.js
```

### Important

Do not change the backend for Stage 33.

Do not put `JWT_SECRET` in the client.

Keep `JWT_SECRET` only in:

```text
server/.env
```

### Migration pattern

Instead of:

```js
const token = localStorage.getItem("playsense_token");

const response = await fetch(
  "http://localhost:5000/api/matches",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();
```

Use:

```js
import { apiGet } from "../utils/api";

const data = await apiGet("/matches");
```

For POST:

```js
import { apiPost } from "../utils/api";

const data = await apiPost("/matches", payload);
```

For PUT:

```js
import { apiPut } from "../utils/api";

const data = await apiPut(`/matches/${id}`, payload);
```

For DELETE:

```js
import { apiDelete } from "../utils/api";

await apiDelete(`/matches/${id}`);
```

### Error handling

```js
try {
  const data = await apiGet("/matches");
  setMatches(Array.isArray(data) ? data : []);
} catch (error) {
  if (error.status === 401) {
    // Session expiration is already handled centrally.
    return;
  }

  setError(
    error.message || "Unable to load your matches."
  );
}
```

### Stage 33 migration order

Migrate these pages one at a time:

1. Dashboard.jsx
2. AddMatch.jsx
3. EditMatch.jsx
4. MatchDetail.jsx
5. Analytics.jsx

Login.jsx and Register.jsx should continue using their authentication-specific fetch logic unless you deliberately create public API helpers for `/auth/login` and `/auth/register`.

### Validation checklist

After copying the files:

1. Start backend:
   `npm run dev`
2. Start client:
   `npm run dev`
3. Login.
4. Dashboard should load matches.
5. Add a match.
6. Edit a match.
7. Open match details.
8. Delete a match.
9. Open Analytics.
10. Logout.
11. Try opening a protected page.
12. Confirm redirect to `/login`.
13. Remove/expire the token and retry a protected API request.
14. Confirm the session is cleared.

Stage 33 is frontend API-layer hardening; it does not replace backend authorization.
