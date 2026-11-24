const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to update this account.");
  return data;
}

export function getUsers() {
  return request("/api/users");
}

export function updateUserEmail(userId, email) {
  return request(`/api/users/${encodeURIComponent(userId)}/email`, {
    method: "PATCH",
    body: JSON.stringify({ email }),
  });
}

export function resetUserPassword(userId, password) {
  return request(`/api/users/${encodeURIComponent(userId)}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}
