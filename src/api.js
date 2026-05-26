const BASE = import.meta.env.VITE_API_BASE;
const SECRET = import.meta.env.VITE_API_SECRET;

if (!BASE) {
  throw new Error("VITE_API_BASE is not set. Copy .env.example to .env and set the Workers URL.");
}

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(SECRET ? { Authorization: `Bearer ${SECRET}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const subscriptions = {
  list: (status = "active") => request(`/api/subscriptions?status=${encodeURIComponent(status)}`),
  create: (data) => request("/api/subscriptions", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id) => request(`/api/subscriptions/${id}`, { method: "DELETE" }),
};

export const meta = {
  get: () => request("/api/meta"),
};

export const settings = {
  list: () => request("/api/settings"),
  update: (key, value) => request(`/api/settings/${key}`, { method: "PATCH", body: JSON.stringify({ value }) }),
};
