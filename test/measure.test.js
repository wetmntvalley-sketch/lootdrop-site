import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { onRequest as measure } from "../functions/api/measure.js";
import { onRequest as campaign } from "../functions/from/homeschool-classifieds.js";

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
    { event: "level1_visit", source: "facebook" },
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
  ].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /headers\.get\(\s*["'](cookie|user-agent|cf-connecting-ip|x-forwarded-for|referer|referrer)/i);
  assert.doesNotMatch(source, /request\.cf/);
  assert.doesNotMatch(source, /console\./);
});
