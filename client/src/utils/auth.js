const TOKEN_KEY = "playsense_token";
const USER_KEY = "playsense_user";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Storage may be unavailable.
  }
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getTokenPayload = (token = getToken()) => {
  if (!token) return null;
  return decodeJwtPayload(token);
};

export const isTokenExpired = (token = getToken()) => {
  const payload = getTokenPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + 5000;
};

export const hasValidSession = () => {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    clearAuth();
    return false;
  }

  return true;
};

export const saveAuth = ({ token, user }) => {
  if (!token || typeof token !== "string") {
    throw new Error("A valid authentication token is required.");
  }

  if (isTokenExpired(token)) {
    throw new Error("The authentication token is already expired.");
  }

  localStorage.setItem(TOKEN_KEY, token);

  if (user) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: user.id || user._id || "",
        name: user.name || "",
        email: user.email || "",
      })
    );
  }
};

export const logout = () => {
  clearAuth();
  window.dispatchEvent(new Event("playsense:logout"));
};

export const getAuthHeaders = () => {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    clearAuth();
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};
