import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("public pages no longer claim the site has no analytics", () => {
  const home = read("index.html");
  const privacy = read("privacy/index.html");
  const llms = read("llms.txt");
  assert.equal(home.includes("no analytics"), false);
  assert.equal(privacy.includes("no analytics"), false);
  assert.match(privacy, /Analytics Engine/);
  assert.match(privacy, /no cookies/i);
  assert.match(llms, /Analytics Engine/);
  assert.equal(llms.includes("no forms, analytics, or trackers"), false);
});

test("free Level 1 PDF is the chapter file, not the Payhip manual", () => {
  const pages = ["index.html", "level-1/index.html", "book/index.html", "printables/index.html"];
  for (const path of pages) {
    const html = read(path);
    assert.match(html, /href="\/level-1\/level-1-spark\.pdf"/, path);
    assert.match(html, /data-measure-event="level1_pdf_click"/, path);
  }
  const lesson = read("level-1/index.html");
  assert.match(lesson, /data-measure-visit="level1_visit"/);
  assert.match(lesson, /not the 178-page manual/);
  assert.equal(lesson.includes('href="https://payhip.com/b/6KDfn" download'), false);
});

test("classified link is a path to the free chapter and is not in the sitemap", () => {
  const ad = read("from/homeschool-classifieds/index.html");
  const sitemap = read("sitemap.xml");
  const robots = read("robots.txt");
  assert.match(ad, /\/level-1\/#homeschool-classifieds/);
  assert.match(ad, /noindex/);
  assert.equal(sitemap.includes("/from/homeschool-classifieds"), false);
  assert.match(sitemap, /level-1-spark\.pdf/);
  assert.match(robots, /Disallow: \/from\//);
  assert.match(robots, /Disallow: \/api\//);
});
