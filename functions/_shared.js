// Coarse visit and click counts. Callers may pass an event name and a source label.
// This file does not read an IP address, user agent, cookie, or Referer header.

export const BINDING = "LEVEL1_EVENTS";

export const PUBLIC_EVENTS = new Set([
  "page_visit",
  "level1_visit",
  "level1_pdf_click",
  "real_code_quest_level1_pdf_click",
  "pocket_games_level1_pdf_click",
  "notify_click",
]);
export const SOURCES = new Set([
  "site",
  "direct",
  "facebook",
  "instagram",
  "other",
  "homeschool-classifieds",
]);
const STICKY_SOURCES = new Set(["facebook", "instagram", "homeschool-classifieds"]);

export const CAMPAIGN_EVENT = "campaign_visit";
export const CAMPAIGN_SOURCE = "homeschool-classifieds";
export const CAMPAIGN_HASH = "homeschool-classifieds";

export const MAX_BODY_BYTES = 160;

const RECORDING_HOSTS = new Set([
  "levelupmakers.com",
  "www.levelupmakers.com",
  "localhost",
  "127.0.0.1",
  "::1",
]);

export function recordingHost(hostname) {
  return RECORDING_HOSTS.has(hostname);
}

export function requestHostname(request) {
  try {
    return new URL(request.url).hostname;
  } catch {
    return "";
  }
}

export function sameOrigin(request) {
  const header = request.headers.get("Origin");
  if (!header || header === "null") return false;
  try {
    return new URL(header).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isJsonRequest(request) {
  const type = request.headers.get("Content-Type") || "";
  return type.split(";")[0].trim().toLowerCase() === "application/json";
}

export async function readLimitedText(request, maxBytes) {
  const declared = request.headers.get("Content-Length");
  if (declared && Number(declared) > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buf);
}

// Returns the two labels to store, or null when the body is not an allowlisted pair.
export function measurePoint(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 2 || !Object.hasOwn(body, "event") || !Object.hasOwn(body, "source")) {
    return null;
  }
  if (typeof body.event !== "string" || typeof body.source !== "string") return null;
  if (!PUBLIC_EVENTS.has(body.event) || !SOURCES.has(body.source)) return null;
  return { event: body.event, source: body.source };
}

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isOwnHost(host) {
  return host === "levelupmakers.com"
    || host === "www.levelupmakers.com"
    || host === "localhost"
    || host === "127.0.0.1"
    || host === "[::1]";
}

function isFacebookHost(host) {
  return host === "facebook.com" || host.endsWith(".facebook.com")
    || host === "fb.com" || host.endsWith(".fb.com")
    || host === "fb.me" || host.endsWith(".fb.me")
    || host === "messenger.com" || host.endsWith(".messenger.com");
}

function isInstagramHost(host) {
  return host === "instagram.com" || host.endsWith(".instagram.com");
}

// Turns a referring address into one allowlisted label. The full address is not returned.
export function sourceFromSignals({ referrer, pageHref, explicit, stored } = {}) {
  if (typeof explicit === "string" && SOURCES.has(explicit)) return explicit;
  if (typeof stored === "string" && STICKY_SOURCES.has(stored)) return stored;
  const refHost = hostnameOf(referrer || "");
  if (!refHost) return "direct";
  const pageHost = hostnameOf(pageHref || "");
  if (refHost === pageHost || isOwnHost(refHost)) return "site";
  if (isFacebookHost(refHost)) return "facebook";
  if (isInstagramHost(refHost)) return "instagram";
  return "other";
}

// Writes one allowlisted point. The timestamp is added by Analytics Engine.
// Returns false when the binding is missing so local static previews still respond.
export function writeEvent(env, event, source) {
  const dataset = env && env[BINDING];
  if (!dataset || typeof dataset.writeDataPoint !== "function") return false;
  dataset.writeDataPoint({
    blobs: [event, source],
    doubles: [1],
    indexes: [event],
  });
  return true;
}

export function empty(status, headers) {
  return new Response(null, { status, headers });
}

export function campaignDestination(request) {
  const dest = new URL("/level-1/", request.url);
  dest.search = "";
  dest.hash = CAMPAIGN_HASH;
  return dest.href;
}
