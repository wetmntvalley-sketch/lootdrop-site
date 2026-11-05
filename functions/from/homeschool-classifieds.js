import {
  CAMPAIGN_EVENT,
  CAMPAIGN_SOURCE,
  campaignDestination,
  empty,
  recordingHost,
  requestHostname,
  writeEvent,
} from "../_shared.js";

const REDIRECT_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

// Distinct Homeschool Classifieds path. Counts the visit, then opens free Level 1.
export function onRequest(context) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return empty(405, { Allow: "GET, HEAD" });
  }

  const headers = {
    ...REDIRECT_HEADERS,
    Location: campaignDestination(request),
  };

  if (request.method === "GET" && recordingHost(requestHostname(request))) {
    writeEvent(context.env, CAMPAIGN_EVENT, CAMPAIGN_SOURCE);
  }

  return empty(302, headers);
}
