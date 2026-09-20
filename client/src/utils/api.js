import { authFetch } from "./authFetch";

export const apiGet = async (path, options = {}) => {
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
