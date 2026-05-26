import {
  notionFetch,
  NotionError,
  subscriptionFromPage,
  subscriptionToProperties,
  databaseSelectOptions,
  settingFromPage,
  settingToProperties,
} from "./notion.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    if (env.API_SECRET) {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (token !== env.API_SECRET) {
        return withCors(
          new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
          env,
          origin,
        );
      }
    }

    try {
      const res = await route(request, url, env);
      return withCors(res, env, origin);
    } catch (err) {
      const status = err instanceof NotionError ? 502 : 500;
      const body = JSON.stringify({ error: err.message || "Internal error" });
      return withCors(new Response(body, { status, headers: { "Content-Type": "application/json" } }), env, origin);
    }
  },
};

async function route(request, url, env) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === "/api/subscriptions" && method === "GET") return listSubscriptions(env, url.searchParams.get("status") || "active");
  if (pathname === "/api/subscriptions" && method === "POST") return createSubscription(await request.json(), env);
  if (pathname === "/api/meta" && method === "GET") return getMeta(env);

  const subMatch = pathname.match(/^\/api\/subscriptions\/([0-9a-f-]{36})$/i);
  if (subMatch && method === "PATCH") return updateSubscription(subMatch[1], await request.json(), env);
  if (subMatch && method === "DELETE") return deleteSubscription(subMatch[1], env);

  if (pathname === "/api/settings" && method === "GET") return listSettings(env);
  const setMatch = pathname.match(/^\/api\/settings\/([\w-]+)$/);
  if (setMatch && method === "PATCH") return updateSetting(setMatch[1], await request.json(), env);

  return json({ error: "Not found" }, 404);
}

async function getMeta(env) {
  const database = await notionFetch(`/databases/${env.NOTION_SUBSCRIPTIONS_DB_ID}`, { method: "GET" }, env);
  return json({
    categories: databaseSelectOptions(database, "category"),
    contractOwners: databaseSelectOptions(database, "contractOwner"),
    paymentMethods: databaseSelectOptions(database, "paymentMethod"),
  });
}

async function listSubscriptions(env, status) {
  const filter =
    status === "archived"
      ? { property: "active", checkbox: { equals: false } }
      : status === "all"
        ? undefined
        : { property: "active", checkbox: { equals: true } };

  const data = await notionFetch(
    `/databases/${env.NOTION_SUBSCRIPTIONS_DB_ID}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        ...(filter ? { filter } : {}),
        page_size: 100,
      }),
    },
    env,
  );
  return json(data.results.map(subscriptionFromPage));
}

async function createSubscription(input, env) {
  const created = await notionFetch(
    `/pages`,
    {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: env.NOTION_SUBSCRIPTIONS_DB_ID },
        properties: subscriptionToProperties({ active: true, ...input }),
      }),
    },
    env,
  );
  return json(subscriptionFromPage(created), 201);
}

async function updateSubscription(id, input, env) {
  const updated = await notionFetch(
    `/pages/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties: subscriptionToProperties(input) }),
    },
    env,
  );
  return json(subscriptionFromPage(updated));
}

async function deleteSubscription(id, env) {
  const updated = await notionFetch(
    `/pages/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties: subscriptionToProperties({ active: false }) }),
    },
    env,
  );
  return json(subscriptionFromPage(updated));
}

async function listSettings(env) {
  const data = await notionFetch(
    `/databases/${env.NOTION_SETTINGS_DB_ID}/query`,
    { method: "POST", body: JSON.stringify({ page_size: 100 }) },
    env,
  );
  const map = {};
  for (const page of data.results) {
    const s = settingFromPage(page);
    if (s.key) map[s.key] = { id: s.id, value: s.value };
  }
  return json(map);
}

async function updateSetting(key, input, env) {
  const data = await notionFetch(
    `/databases/${env.NOTION_SETTINGS_DB_ID}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "key", title: { equals: key } },
        page_size: 1,
      }),
    },
    env,
  );

  const value = input.value;

  if (data.results.length === 0) {
    const created = await notionFetch(
      `/pages`,
      {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: env.NOTION_SETTINGS_DB_ID },
          properties: settingToProperties({ key, value }),
        }),
      },
      env,
    );
    return json(settingFromPage(created), 201);
  }

  const updated = await notionFetch(
    `/pages/${data.results[0].id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ properties: settingToProperties({ value }) }),
    },
    env,
  );
  return json(settingFromPage(updated));
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function corsHeaders(env, origin) {
  const allowed = (env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim());
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(res, env, origin) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(env, origin))) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}
