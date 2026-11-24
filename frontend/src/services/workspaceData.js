const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const WORKSPACE_DATA_URL = `${API_BASE}/api/workspace-data`;

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

let saveQueue = Promise.resolve();
export function saveWorkspaceData(data) {
  const save = () => request("", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  saveQueue = saveQueue.catch(() => {}).then(save);
  return saveQueue;
}
