const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const WORKSPACE_DATA_URL = `${API_BASE}/api/workspace-data`;
const WORKSPACE_CACHE_KEYS = {
  currencies: "white-star-currency-rates",
  rates: "white-star-gst-rates",
  items: "white-star-items",
  customers: "white-star-customers",
  buyers: "white-star-buyers",
  places: "white-star-places",
};

async function request(path = "", options = {}) {
  const response = await fetch(`${WORKSPACE_DATA_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load workspace data.");
  return data;
}

export function loadWorkspaceData() {
  return request();
}

export async function preloadWorkspaceData(userId) {
  const data = await loadWorkspaceData();
  if (!data.initialized || !userId) return data;
  Object.entries(WORKSPACE_CACHE_KEYS).forEach(([field, key]) => {
    window.localStorage.setItem(`${key}:${userId}`, JSON.stringify(data[field]));
  });
  return data;
}

let saveQueue = Promise.resolve();
export function saveWorkspaceData(data) {
  const save = () => request("", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  saveQueue = saveQueue.catch(() => {}).then(save);
  return saveQueue;
}
