const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const INVOICES_URL = `${API_BASE}/api/invoices`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Unable to load invoices.");
  return data;
}

export function getInvoices() {
  return request(INVOICES_URL);
}

export function getInvoice(invoiceId) {
  return request(`${INVOICES_URL}/${encodeURIComponent(invoiceId)}`);
}

export function createInvoice(data) {
  return request(INVOICES_URL, { method: "POST", body: JSON.stringify(data) });
}

let saveQueue = Promise.resolve();
export function saveInvoice(invoiceId, data) {
  const save = () => invoiceId
    ? request(`${INVOICES_URL}/${encodeURIComponent(invoiceId)}`, { method: "PUT", body: JSON.stringify(data) })
    : request(INVOICES_URL, { method: "POST", body: JSON.stringify(data) });
  saveQueue = saveQueue.catch(() => {}).then(save);
  return saveQueue;
}
