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

test("funding page is cautious and listed for parents", () => {
  const page = read("funding/index.html");
  const sitemap = read("sitemap.xml");
  const llms = read("llms.txt");
  const book = read("book/index.html");
  const home = read("index.html");
  assert.match(page, /FAQPage/);
  assert.match(page, /can't guarantee eligibility/);
  assert.match(page, /178 pages/);
  assert.match(page, /10 levels/);
  assert.match(page, /ages 9–13/);
  assert.match(page, /https:\/\/www\.amazon\.com\/dp\/B0HQDMJ24G/);
  assert.match(page, /https:\/\/payhip\.com\/b\/6KDfn/);
  assert.match(page, /https:\/\/payhip\.com\/b\/NsL1H/);
  assert.match(page, /https:\/\/levelupmakers\.com\/level-1\//);
  assert.equal(page.includes("grandmother"), false);
  assert.equal(page.includes("grandson"), false);
  assert.match(sitemap, /https:\/\/levelupmakers\.com\/funding\//);
  assert.match(llms, /https:\/\/levelupmakers\.com\/funding\//);
  assert.match(book, /href="\/funding\/"/);
  assert.match(home, /href="\/funding\/"/);
  for (const path of ["index.html", "book/index.html", "contact/index.html", "404.html"]) {
    assert.match(read(path), /href="\/funding\/">ESA or charter funds</, path);
  }
});

test("star catcher practice file is a free download with import steps", () => {
  const page = read("star-catcher/index.html");
  const body = page.split("<footer>")[0];
  const sitemap = read("sitemap.xml");
  const home = read("index.html");
  const png = readFileSync("downloads/star-catcher-practice.png");
  assert.match(page, /href="\/downloads\/star-catcher-practice\.png" download="star-catcher-practice\.png"/);
  assert.match(page, /Import File/);
  assert.match(page, /arcade\.makecode\.com/);
  assert.match(page, /Level Up 2: Real Code Quest/);
  assert.match(page, /drag the PNG onto the MakeCode editor/);
  assert.equal(body.includes("$"), false);
  assert.equal(body.includes("grandmother"), false);
  assert.equal(body.includes("grandson"), false);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.match(sitemap, /https:\/\/levelupmakers\.com\/star-catcher\//);
  assert.match(sitemap, /https:\/\/levelupmakers\.com\/downloads\/star-catcher-practice\.png/);
  assert.match(home, /href="\/star-catcher\/"/);
  for (const path of ["index.html", "level-1/index.html", "book/index.html", "404.html"]) {
    assert.match(read(path), /href="\/star-catcher\/">Star Catcher</, path);
  }
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
