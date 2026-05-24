const NOTION_VERSION = "2022-06-28";
const BASE = "https://api.notion.com/v1";

export function notionHeaders(apiKey) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function notionFetch(path, init, env) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...notionHeaders(env.NOTION_API_KEY), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new NotionError(res.status, text);
  }
  return res.json();
}

export class NotionError extends Error {
  constructor(status, body) {
    super(`Notion API ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

const rt = (s) => (s ? [{ type: "text", text: { content: String(s) } }] : []);
const title = (s) => (s ? [{ type: "text", text: { content: String(s) } }] : []);
const plain = (arr) => (arr && arr.length ? arr.map((x) => x.plain_text).join("") : "");

export function subscriptionFromPage(page) {
  const p = page.properties;
  return {
    id: page.id,
    name: plain(p.name?.title),
    category: p.category?.select?.name ?? "",
    plan: plain(p.plan?.rich_text),
    amount: p.amount?.number ?? 0,
    cycle: p.cycle?.select?.name ?? "monthly",
    renewalDate: p.renewalDate?.date?.start ?? null,
    url: p.url?.url ?? "",
    cancelUrl: p.cancelUrl?.url ?? "",
    cancelMethod: plain(p.cancelMethod?.rich_text),
    notes: plain(p.notes?.rich_text),
    active: p.active?.checkbox ?? true,
  };
}

export function subscriptionToProperties(input) {
  const props = {};
  if (input.name !== undefined) props.name = { title: title(input.name) };
  if (input.category !== undefined) props.category = { select: input.category ? { name: input.category } : null };
  if (input.plan !== undefined) props.plan = { rich_text: rt(input.plan) };
  if (input.amount !== undefined) props.amount = { number: Number(input.amount) };
  if (input.cycle !== undefined) props.cycle = { select: { name: input.cycle } };
  if (input.renewalDate !== undefined) props.renewalDate = { date: input.renewalDate ? { start: input.renewalDate } : null };
  if (input.url !== undefined) props.url = { url: input.url || null };
  if (input.cancelUrl !== undefined) props.cancelUrl = { url: input.cancelUrl || null };
  if (input.cancelMethod !== undefined) props.cancelMethod = { rich_text: rt(input.cancelMethod) };
  if (input.notes !== undefined) props.notes = { rich_text: rt(input.notes) };
  if (input.active !== undefined) props.active = { checkbox: !!input.active };
  return props;
}

export function settingFromPage(page) {
  const p = page.properties;
  return {
    id: page.id,
    key: plain(p.key?.title),
    value: plain(p.value?.rich_text),
  };
}

export function settingToProperties({ key, value }) {
  const props = {};
  if (key !== undefined) props.key = { title: title(key) };
  if (value !== undefined) props.value = { rich_text: rt(value) };
  return props;
}
