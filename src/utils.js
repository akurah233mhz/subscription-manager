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

export function effectiveAmountJpy(sub) {
  if (sub.amountJpy != null) return Number(sub.amountJpy);
  if ((sub.currency || "JPY") === "JPY") return Number(sub.amount ?? 0);
  return null;
}

export function toMonthlyJpy(sub) {
  const amount = effectiveAmountJpy(sub);
  return amount == null ? 0 : toMonthly(amount, sub.cycle);
}

export function formatJpy(amount, cycle) {
  const value = Number(amount ?? 0);
  return cycle === "yearly" ? `¥${value.toLocaleString()}/年` : `¥${value.toLocaleString()}/月`;
}

export function formatAmount(amount, cycle, currency = "JPY") {
  const value = Number(amount ?? 0);
  const suffix = cycle === "yearly" ? "/年" : "/月";
  if (currency === "JPY") return formatJpy(value, cycle);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted}${suffix}`;
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
