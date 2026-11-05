// Coarse Level 1 counts. Callers may pass an event name and a source label.
// Nothing in this file reads an IP address, user agent, cookie, or request body.

export const BINDING = "LEVEL1_EVENTS";

export const PUBLIC_EVENTS = new Set(["level1_visit", "level1_pdf_click"]);
export const SOURCES = new Set(["site", "homeschool-classifieds"]);

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
