import { authFetch } from "./authFetch";

/* =========================================================
   PROTECTED API REQUESTS
   ========================================================= */

export const apiGet = async (
  path,
  options = {}
) => {
  const { data } = await authFetch(path, {
    ...options,
    method: "GET",
  });

  return data;
};

export const apiPost = async (
  path,
  payload,
  options = {}
) => {
  const { data } = await authFetch(path, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(payload),
  });

  return data;
};

export const apiPut = async (
  path,
  payload,
  options = {}
) => {
  const { data } = await authFetch(path, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(payload),
  });

  return data;
};

export const apiDelete = async (
  path,
  options = {}
) => {
  const { data } = await authFetch(path, {
    ...options,
    method: "DELETE",
  });

  return data;
};

/* =========================================================
   PUBLIC API REQUESTS
   =========================================================
   
   Used for endpoints that must work before the user
   has a JWT, such as login and registration.
   ========================================================= */

export const apiPostPublic = async (
  path,
  payload,
  options = {}
) => {
  const { data } = await authFetch(path, {
    ...options,
    method: "POST",
    skipAuth: true,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(payload),
  });

  return data;
}; 