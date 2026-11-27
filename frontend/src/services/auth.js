const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const AUTH_URL = `${API_BASE}/api/auth`;

async function request(path, options = {}) {
  const response = await fetch(`${AUTH_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Unable to connect to the sign-in service.");
  }
  return data;
}

export function signIn(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return request("/me");
}

export function signOut() {
  return request("/logout", { method: "POST" });
}

export function changeAdminEmail(email, currentPassword) {
  return request("/email", {
    method: "PATCH",
    body: JSON.stringify({ email, currentPassword }),
  });
}

export function changeAdminPassword(currentPassword, newPassword) {
  return request("/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

