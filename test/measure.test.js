import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { onRequest as measure } from "../functions/api/measure.js";
import { onRequest as campaign } from "../functions/from/homeschool-classifieds.js";
import { sourceFromSignals } from "../functions/_shared.js";
import worker from "../worker/index.js";

function recorder() {
  const points = [];
  return {
    points,
    env: {
      LEVEL1_EVENTS: {
        writeDataPoint(point) {
          points.push(point);
        },
      },
    },
  };
}

function context(request, env) {
  return { request, env };
}

function post(url, body, { origin = new URL(url).origin, contentType = "application/json", headers = {} } = {}) {
  const h = new Headers(headers);
  if (origin) h.set("Origin", origin);
  if (contentType) h.set("Content-Type", contentType);
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(url, { method: "POST", headers: h, body: payload });
}

test("stores a Level 1 visit as event name and source only", async () => {
  const { env, points } = recorder();
  const request = post("https://levelupmakers.com/api/measure", {
    event: "level1_visit",
    source: "site",
  }, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "CF-Connecting-IP": "203.0.113.8",
      Cookie: "session=secret",
      Referer: "https://example.com/ad?email=child@example.com",
    },
  });
  const response = await measure(context(request, env));
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.deepEqual(points, [
    {
      blobs: ["level1_visit", "site"],
      doubles: [1],
      indexes: ["level1_visit"],
    },
  ]);
  assert.equal(JSON.stringify(points).includes("203.0.113.8"), false);
  assert.equal(JSON.stringify(points).includes("Mozilla"), false);
  assert.equal(JSON.stringify(points).includes("child@example.com"), false);
});

test("coming soon level 1 pdf clicks use their own event names", async () => {
  const { env, points } = recorder();
  for (const event of ["real_code_quest_level1_pdf_click", "pocket_games_level1_pdf_click"]) {
    const body = { event, source: "homeschool-classifieds" };
    assert.ok(JSON.stringify(body).length <= 160, event);
    const response = await measure(context(post("https://levelupmakers.com/api/measure", body), env));
    assert.equal(response.status, 204, event);
  }
  assert.deepEqual(points.map((point) => point.blobs[0]), [
    "real_code_quest_level1_pdf_click",
    "pocket_games_level1_pdf_click",
  ]);
});

test("stores a classified-ad PDF click source", async () => {
  const { env, points } = recorder();
  const response = await measure(context(post("http://127.0.0.1:8788/api/measure", {
    event: "level1_pdf_click",
    source: "homeschool-classifieds",
  }), env));
  assert.equal(response.status, 204);
  assert.deepEqual(points[0].blobs, ["level1_pdf_click", "homeschool-classifieds"]);
});

test("rejects events outside the allowlist, including campaign writes", async () => {
  const { env, points } = recorder();
  const cases = [
    { event: "campaign_visit", source: "homeschool-classifieds" },
    { event: "level1_visit", source: "https://facebook.com/groups/secret?email=child@example.com" },
    { event: "page_view", source: "site" },
    { event: "level1_visit", source: "site", email: "a@b.c" },
    { event: 1, source: "site" },
  ];
  for (const body of cases) {
    const response = await measure(context(post("https://levelupmakers.com/api/measure", body), env));
    assert.equal(response.status, 400, JSON.stringify(body));
  }
  assert.equal(points.length, 0);
});

test("rejects a body that is larger than the small limit", async () => {
  const { env, points } = recorder();
  const response = await measure(context(post(
    "https://levelupmakers.com/api/measure",
    `{"event":"level1_visit","source":"site","pad":"${"x".repeat(200)}"}`,
  ), env));
  assert.equal(response.status, 400);
  assert.equal(points.length, 0);
});

test("does not read or write for the wrong method, origin, host, or content type", async () => {
  const { env, points } = recorder();
  const get = await measure(context(new Request("https://levelupmakers.com/api/measure"), env));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("Allow"), "POST");

  const cross = await measure(context(post("https://levelupmakers.com/api/measure", {
    event: "level1_visit",
    source: "site",
  }, { origin: "https://evil.example" }), env));
  assert.equal(cross.status, 403);

  const missingOrigin = await measure(context(post("https://levelupmakers.com/api/measure", {
    event: "level1_visit",
    source: "site",
  }, { origin: "" }), env));
  assert.equal(missingOrigin.status, 403);

  const preview = await measure(context(post("https://levelupmakers.pages.dev/api/measure", {
    event: "level1_visit",
    source: "site",
  }), env));
  assert.equal(preview.status, 403);

  const text = await measure(context(post("https://levelupmakers.com/api/measure", "event=level1_visit", {
    contentType: "text/plain",
  }), env));
  assert.equal(text.status, 415);
  assert.equal(points.length, 0);
});

test("accepts a valid event when the binding is not connected", async () => {
  const response = await measure(context(post("http://localhost:8788/api/measure", {
    event: "level1_visit",
    source: "site",
  }), {}));
  assert.equal(response.status, 204);
});

test("classified path counts one campaign visit and redirects to free Level 1", async () => {
  const { env, points } = recorder();
  const request = new Request("https://www.levelupmakers.com/from/homeschool-classifieds?utm_source=ad&email=child@example.com", {
    headers: { "User-Agent": "Mozilla/5.0", "CF-Connecting-IP": "203.0.113.9" },
  });
  const response = await campaign(context(request, env));
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("Location"), "https://www.levelupmakers.com/level-1/#homeschool-classifieds");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.deepEqual(points, [
    {
      blobs: ["campaign_visit", "homeschool-classifieds"],
      doubles: [1],
      indexes: ["campaign_visit"],
    },
  ]);
  assert.equal(JSON.stringify(points).includes("utm_source"), false);
  assert.equal(JSON.stringify(points).includes("203.0.113.9"), false);
});

test("classified HEAD redirects without writing", async () => {
  const { env, points } = recorder();
  const response = await campaign(context(new Request("http://localhost:8788/from/homeschool-classifieds", {
    method: "HEAD",
  }), env));
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("Location")).hash, "#homeschool-classifieds");
  assert.equal(points.length, 0);
});

test("classified path on a preview host redirects and does not write", async () => {
  const { env, points } = recorder();
  const response = await campaign(context(new Request("https://abc.levelupmakers.pages.dev/from/homeschool-classifieds"), env));
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("Location")).pathname, "/level-1/");
  assert.equal(points.length, 0);
});

test("classified POST cannot write an event", async () => {
  const { env, points } = recorder();
  const response = await campaign(context(new Request("https://levelupmakers.com/from/homeschool-classifieds", {
    method: "POST",
    body: '{"event":"campaign_visit","source":"homeschool-classifieds"}',
    headers: { "Content-Type": "application/json", Origin: "https://levelupmakers.com" },
  }), env));
  assert.equal(response.status, 405);
  assert.equal(points.length, 0);
});

test("function source does not read identifying headers", () => {
  const source = [
    "functions/_shared.js",
    "functions/api/measure.js",
    "functions/from/homeschool-classifieds.js",
    "worker/index.js",
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /headers\.get\(\s*["'](cookie|user-agent|cf-connecting-ip|x-forwarded-for|referer|referrer)/i);
  assert.doesNotMatch(source, /request\.cf/);
  const functionsOnly = [
    "functions/_shared.js",
    "functions/api/measure.js",
    "functions/from/homeschool-classifieds.js",
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(functionsOnly, /console\./);
});

test("referrer becomes a short label and the address is dropped", () => {
  assert.equal(sourceFromSignals({
    referrer: "https://l.facebook.com/l.php?u=https%3A%2F%2Flevelupmakers.com&email=child@example.com",
    pageHref: "https://levelupmakers.com/",
  }), "facebook");
  assert.equal(sourceFromSignals({
    referrer: "https://www.instagram.com/p/abc/",
    pageHref: "https://levelupmakers.com/pocket-games/",
  }), "instagram");
  assert.equal(sourceFromSignals({
    referrer: "",
    pageHref: "https://levelupmakers.com/",
  }), "direct");
  assert.equal(sourceFromSignals({
    referrer: "https://levelupmakers.com/real-code-quest/",
    pageHref: "https://levelupmakers.com/level-1/",
  }), "site");
  assert.equal(sourceFromSignals({
    referrer: "https://example.com/path?email=child@example.com",
    pageHref: "https://levelupmakers.com/",
  }), "other");
  assert.equal(sourceFromSignals({
    referrer: "https://example.com/",
    pageHref: "https://levelupmakers.com/",
    explicit: "facebook",
  }), "facebook");
  assert.equal(sourceFromSignals({
    referrer: "https://levelupmakers.com/",
    pageHref: "https://levelupmakers.com/level-1/",
    stored: "facebook",
  }), "facebook");
  assert.equal(sourceFromSignals({
    referrer: "",
    pageHref: "https://levelupmakers.com/",
    explicit: "https://facebook.com/groups/1",
  }), "direct");
  const labeled = sourceFromSignals({
    referrer: "https://lm.facebook.com/l.php?email=child@example.com",
    pageHref: "https://levelupmakers.com/real-code-quest/",
  });
  assert.equal(labeled, "facebook");
  assert.equal(labeled.includes("child@example.com"), false);
});

test("worker stores a page visit from an allowed origin and ignores identifying headers", async () => {
  const { env, points } = recorder();
  const request = new Request("https://levelupmakers-count.wetmntvalley.workers.dev/measure", {
    method: "POST",
    headers: {
      Origin: "https://levelupmakers.com",
      "Content-Type": "text/plain",
      "User-Agent": "Mozilla/5.0",
      "CF-Connecting-IP": "203.0.113.8",
      Cookie: "session=secret",
      Referer: "https://l.facebook.com/l.php?email=child@example.com",
    },
    body: JSON.stringify({ event: "page_visit", source: "facebook" }),
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://levelupmakers.com");
  assert.deepEqual(points, [{
    blobs: ["page_visit", "facebook"],
    doubles: [1],
    indexes: ["page_visit"],
  }]);
  assert.equal(JSON.stringify(points).includes("child@example.com"), false);
  assert.equal(JSON.stringify(points).includes("203.0.113.8"), false);
});

test("worker rejects a notify click from an unknown origin", async () => {
  const { env, points } = recorder();
  const request = new Request("https://levelupmakers-count.wetmntvalley.workers.dev/measure", {
    method: "POST",
    headers: {
      Origin: "https://evil.example",
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ event: "notify_click", source: "facebook" }),
  });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 403);
  assert.equal(points.length, 0);
});

test("coming soon notify links and the counter script are on the public pages", () => {
  const measureJs = readFileSync("assets/measure.js", "utf8");
  const measureUrl = "https://levelupmakers-count.wetmntvalley.workers.dev/measure";
  assert.equal(measureJs.split(measureUrl).length - 1, 1);
  assert.match(measureJs, /var MEASURE_URL = "https:\/\/levelupmakers-count\.wetmntvalley\.workers\.dev\/measure"/);
  assert.equal(readFileSync("llms.txt", "utf8").includes(measureUrl), false);
  const workerSource = readFileSync("worker/index.js", "utf8");
  assert.match(workerSource, /https:\/\/levelupmakers\.com/);
  assert.match(workerSource, /https:\/\/www\.levelupmakers\.com/);
  assert.match(measureJs, /JSON\.stringify\(\{ event: eventName, source: source \}\)/);
  assert.equal(measureJs.includes("document.referrer"), true);
  assert.equal(measureJs.includes("referrer: source"), false);
  for (const path of ["real-code-quest/index.html", "pocket-games/index.html", "index.html", "level-1/index.html"]) {
    const html = readFileSync(path, "utf8");
    assert.match(html, /src="\/assets\/measure\.js"/, path);
  }
  for (const path of ["real-code-quest/index.html", "pocket-games/index.html"]) {
    const html = readFileSync(path, "utf8");
    assert.match(html, /data-measure-event="notify_click"/, path);
    assert.match(html, /data-measure-event="level1_pdf_click"/, path);
  }
  const quest = readFileSync("real-code-quest/index.html", "utf8");
  const pocket = readFileSync("pocket-games/index.html", "utf8");
  assert.match(quest, /href="\/real-code-quest\/real-code-quest-level-1\.pdf"/);
  assert.match(quest, /data-measure-event="real_code_quest_level1_pdf_click"/);
  assert.match(pocket, /href="\/pocket-games\/pocket-games-level-1\.pdf"/);
  assert.match(pocket, /data-measure-event="pocket_games_level1_pdf_click"/);
  assert.match(readFileSync("sitemap.xml", "utf8"), /real-code-quest-level-1\.pdf/);
  assert.match(readFileSync("sitemap.xml", "utf8"), /pocket-games-level-1\.pdf/);
  const facebook = readFileSync("from/facebook/index.html", "utf8");
  assert.match(facebook, /\/\?from=facebook/);
  assert.match(facebook, /noindex/);
  assert.equal(readFileSync("sitemap.xml", "utf8").includes("/from/facebook"), false);
});
