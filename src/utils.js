const MS_PER_DAY = 86400000;

// "YYYY-MM-DD" をローカルタイムの0時として解釈する。
// new Date("2026-07-27") は UTC 0時になるため、JSTではそのまま比較すると1日ずれる。
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// 基準日から addMonths ヶ月後。月末日は移動先の月の日数に丸める（1/31 → 2/28）。
function addMonths(year, month, day, addMonths) {
  const d = new Date(year, month + addMonths, 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

// Notionの renewalDate は「ある回の更新日」で、過ぎても自動では進まない。
// 契約サイクル分を繰り上げて、今日以降の次回更新日を求める。
export function nextRenewalDate(dateStr, cycle) {
  const base = parseDate(dateStr);
  if (!base) return null;
  const today = startOfToday();
  if (base >= today) return base;

  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();
  const step = cycle === "yearly" ? 12 : 1;

  // 丸めによるずれを避けるため、繰り上げは常に基準日からの月数で計算する
  const elapsed = (today.getFullYear() - year) * 12 + (today.getMonth() - month);
  let n = Math.max(0, Math.floor(elapsed / step));
  let next = addMonths(year, month, day, n * step);
  while (next < today) {
    n += 1;
    next = addMonths(year, month, day, n * step);
  }
  return next;
}

export function daysUntil(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return Infinity;
  return Math.round((d - startOfToday()) / MS_PER_DAY);
}

export function formatDate(date) {
  const d = date instanceof Date ? date : parseDate(date);
  if (!d) return "";
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
