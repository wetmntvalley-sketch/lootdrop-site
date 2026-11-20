import {
  MAX_BODY_BYTES,
  empty,
  measurePoint,
  readLimitedText,
  writeEvent,
} from "../functions/_shared.js";

// Public counter for the GitHub Pages site. The website stays on GitHub Pages.
// This Worker only stores an allowlisted event name and source label.

const SITE_ORIGINS = new Set([
  "https://levelupmakers.com",
  "https://www.levelupmakers.com",
]);

function allowedOrigin(origin) {
  if (SITE_ORIGINS.has(origin)) return origin;
  if (!origin) return "";
  let url;
  try {
    url = new URL(origin);
  } catch {
    return "";
  }
  if (url.protocol !== "http:") return "";
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return origin;
  return "";
}

function withCors(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers });
}

function contentType(request) {
  const type = request.headers.get("Content-Type") || "";
  return type.split(";")[0].trim().toLowerCase();
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request.headers.get("Origin"));
    if (!origin) return empty(403);

    if (request.method === "OPTIONS") {
      return withCors(empty(204), origin);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/measure" && url.pathname !== "/measure/") {
      return withCors(empty(404), origin);
    }
    if (request.method !== "POST") {
      return withCors(empty(405, { Allow: "POST, OPTIONS" }), origin);
    }

    const type = contentType(request);
    if (type !== "text/plain" && type !== "application/json") {
      return withCors(empty(415), origin);
    }

    const raw = await readLimitedText(request, MAX_BODY_BYTES);
    if (raw == null) return withCors(empty(400), origin);

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return withCors(empty(400), origin);
    }

    const point = measurePoint(body);
    if (!point) return withCors(empty(400), origin);

    const stored = writeEvent(env, point.event, point.source);
    console.log(JSON.stringify({ event: point.event, source: point.source, stored }));
    return withCors(empty(204), origin);
  },
};
