import {
  MAX_BODY_BYTES,
  PUBLIC_EVENTS,
  SOURCES,
  empty,
  isJsonRequest,
  readLimitedText,
  recordingHost,
  requestHostname,
  sameOrigin,
  writeEvent,
} from "../_shared.js";

// Public write endpoint for two lesson events. It does not return stored totals.
export async function onRequest(context) {
  const { request } = context;
  if (request.method !== "POST") {
    return empty(405, { Allow: "POST" });
  }
  if (!recordingHost(requestHostname(request)) || !sameOrigin(request)) {
    return empty(403);
  }
  if (!isJsonRequest(request)) {
    return empty(415);
  }

  const raw = await readLimitedText(request, MAX_BODY_BYTES);
  if (raw == null) return empty(400);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return empty(400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return empty(400);

  const keys = Object.keys(body);
  if (keys.length !== 2 || !Object.hasOwn(body, "event") || !Object.hasOwn(body, "source")) {
    return empty(400);
  }
  if (!PUBLIC_EVENTS.has(body.event) || !SOURCES.has(body.source)) return empty(400);

  writeEvent(context.env, body.event, body.source);
  return empty(204);
}
