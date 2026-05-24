export function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr) - today) / 86400000);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export function toMonthly(amount, cycle) {
  return cycle === "yearly" ? Math.round(amount / 12) : amount;
}

export function formatAmount(amount, cycle) {
  return cycle === "yearly"
    ? `¥${amount.toLocaleString()}/年`
    : `¥${amount.toLocaleString()}/月`;
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
