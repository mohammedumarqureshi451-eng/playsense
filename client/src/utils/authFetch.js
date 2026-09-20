import { getToken, isTokenExpired, clearAuth } from "./auth";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DEFAULT_TIMEOUT = 10000;

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

const parseResponseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";

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

const createApiError = (response, data) => {
  let message = "Something went wrong.";

  if (data && typeof data === "object") {
    message =
      data.message ||
      data.error ||
      data.msg ||
      message;
  } else if (typeof data === "string" && data.trim()) {
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

export const authFetch = async (path, options = {}) => {
  const token = getToken();

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

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, options.timeout || DEFAULT_TIMEOUT);

  try {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await parseResponseBody(response);

    if (response.status === 401) {
      clearAuth();

      window.dispatchEvent(
        new Event("playsense:session-expired")
      );

      const error = createApiError(response, data);

      error.code = "SESSION_EXPIRED";

      throw error;
    }

    if (!response.ok) {
      throw createApiError(response, data);
    }

    return {
      data,
      response,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "The request timed out. Please check your connection and try again."
      );

      timeoutError.code = "TIMEOUT";
      timeoutError.status = 408;

      throw timeoutError;
    }

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