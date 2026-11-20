import {
  MAX_BODY_BYTES,
  empty,
  isJsonRequest,
  measurePoint,
  readLimitedText,
  recordingHost,
  requestHostname,
  sameOrigin,
  writeEvent,
} from "../_shared.js";

// Public write endpoint for allowlisted visit and click events. It does not return stored totals.
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
  const point = measurePoint(body);
  if (!point) return empty(400);

  writeEvent(context.env, point.event, point.source);
  return empty(204);
}
