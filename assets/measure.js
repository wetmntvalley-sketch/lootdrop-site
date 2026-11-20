import { sourceFromSignals } from "/functions/_shared.js";

// Public address of the counter Worker. Not a secret.
// The workers.dev subdomain must be exactly "levelupmakers". See MEASUREMENT.md.
var MEASURE_URL = "https://levelupmakers-count.levelupmakers.workers.dev/measure";
var STICKY_KEY = "lum-source";

function productionHost() {
  return location.hostname === "levelupmakers.com" || location.hostname === "www.levelupmakers.com";
}

function explicitFromLocation() {
  var from = "";
  try {
    from = new URLSearchParams(location.search).get("from") || "";
  } catch (err) {
    from = "";
  }
  if (from) return from;
  var hash = (location.hash || "").replace(/^#/, "");
  if (hash === "homeschool-classifieds") return "homeschool-classifieds";
  if (hash.indexOf("from=") === 0) return decodeURIComponent(hash.slice(5));
  return "";
}

function readStored() {
  try {
    return sessionStorage.getItem(STICKY_KEY) || "";
  } catch (err) {
    return "";
  }
}

function writeStored(source) {
  if (source !== "facebook" && source !== "instagram" && source !== "homeschool-classifieds") return;
  try {
    sessionStorage.setItem(STICKY_KEY, source);
  } catch (err) {}
}

function cleanCampaignMark() {
  if (!history.replaceState) return;
  var url = new URL(location.href);
  var hash = url.hash;
  url.searchParams.delete("from");
  if (hash === "#homeschool-classifieds" || hash.indexOf("#from=") === 0) url.hash = "";
  var next = url.pathname + url.search + url.hash;
  if (next !== location.pathname + location.search + location.hash) {
    history.replaceState(null, "", next);
  }
}

function currentSource() {
  var explicit = explicitFromLocation();
  var source = sourceFromSignals({
    referrer: document.referrer,
    pageHref: location.href,
    explicit: explicit,
    stored: readStored(),
  });
  writeStored(source);
  cleanCampaignMark();
  return source;
}

function postMeasure(eventName, source) {
  var body = JSON.stringify({ event: eventName, source: source });
  fetch(MEASURE_URL, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: { "Content-Type": "text/plain" },
    body: body,
    keepalive: true,
  }).catch(function () {});
}

if (productionHost()) {
  var measureSource = currentSource();
  postMeasure("page_visit", measureSource);
  var visitEvent = document.body && document.body.getAttribute("data-measure-visit");
  if (visitEvent === "level1_visit") postMeasure(visitEvent, measureSource);
  document.addEventListener("click", function (e) {
    var link = e.target && e.target.closest ? e.target.closest("[data-measure-event]") : null;
    if (!link) return;
    var eventName = link.getAttribute("data-measure-event");
    if (eventName !== "level1_pdf_click" && eventName !== "notify_click") return;
    postMeasure(eventName, measureSource);
  });
}
