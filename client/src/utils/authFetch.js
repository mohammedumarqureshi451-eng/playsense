import { getToken, isTokenExpired, clearAuth } from "./auth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DEFAULT_TIMEOUT = 10000;

/* =========================================================
   BUILD API URL
   ========================================================= */

const buildUrl = (path) => {
  if (!path) {
    return API_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = API_URL.replace(/\/+$/, "");
  const normalizedPath = String(path).replace(/^\/+/, "");

  return `${normalizedBase}/${normalizedPath}`;
};

/* =========================================================
   PARSE RESPONSE BODY
   ========================================================= */

const parseResponseBody = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

/* =========================================================
   CREATE API ERROR
   ========================================================= */

const createApiError = (response, data) => {
  let message = "Something went wrong.";

  if (data && typeof data === "object") {
    message =
      data.message ||
      data.error ||
      data.msg ||
      message;
  } else if (
    typeof data === "string" &&
    data.trim()
  ) {
    message = data;
  } else if (response.statusText) {
    message = response.statusText;
  }

  const error = new Error(message);

  error.status = response.status;
  error.statusText = response.statusText;
  error.data = data;

  return error;
};

/* =========================================================
   AUTHENTICATED API REQUEST
   ========================================================= */

export const authFetch = async (
  path,
  options = {}
) => {
  /*
   * skipAuth is used by public endpoints such as:
   *
   * POST /auth/login
   * POST /auth/register
   *
   * These requests must work before a JWT exists.
   */
  const {
    skipAuth = false,
    timeout = DEFAULT_TIMEOUT,
    headers: optionHeaders = {},
    ...fetchOptions
  } = options;

  let token = null;

  /* =======================================================
     CHECK AUTHENTICATION
     ======================================================= */

  if (!skipAuth) {
    token = getToken();

    if (!token || isTokenExpired()) {
      clearAuth();

      window.dispatchEvent(
        new Event("playsense:session-expired")
      );

      const error = new Error(
        "Your session has expired. Please log in again."
      );

      error.status = 401;
      error.code = "SESSION_EXPIRED";

      throw error;
    }
  }

  /* =======================================================
     REQUEST TIMEOUT
     ======================================================= */

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    /* =====================================================
       REQUEST HEADERS
       ===================================================== */

    const headers = {
      Accept: "application/json",
      ...optionHeaders,
    };

    /*
     * Only attach Authorization when a valid token exists.
     *
     * Login/register requests will not receive this header.
     */
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    /* =====================================================
       SEND REQUEST
       ===================================================== */

    const response = await fetch(buildUrl(path), {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    /* =====================================================
       PARSE RESPONSE
       ===================================================== */

    const data = await parseResponseBody(response);

    /* =====================================================
       HANDLE EXPIRED SESSION
       ===================================================== */

    /*
     * Only authenticated requests should trigger the
     * session-expired behavior.
     *
     * Login/register may legitimately return 401/400
     * because of invalid credentials or validation errors.
     */
    if (response.status === 401 && !skipAuth) {
      clearAuth();

      window.dispatchEvent(
        new Event("playsense:session-expired")
      );

      const error = createApiError(
        response,
        data
      );

      error.code = "SESSION_EXPIRED";

      throw error;
    }

    /* =====================================================
       HANDLE OTHER API ERRORS
       ===================================================== */

    if (!response.ok) {
      throw createApiError(response, data);
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return {
      data,
      response,
    };
  } catch (error) {
    /* =====================================================
       REQUEST TIMEOUT
       ===================================================== */

    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "The request timed out. Please check your connection and try again."
      );

      timeoutError.code = "TIMEOUT";
      timeoutError.status = 408;

      throw timeoutError;
    }

    /* =====================================================
       NETWORK ERROR
       ===================================================== */

    if (
      error instanceof TypeError &&
      !error.status
    ) {
      const networkError = new Error(
        "Unable to connect to the server. Please check your connection and try again."
      );

      networkError.code = "NETWORK_ERROR";

      throw networkError;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export default authFetch; 