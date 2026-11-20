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
  assert.match(lesson, /href="https:\/\/payhip\.com\/b\/tlxyB"/);
  assert.match(lesson, /get it by email from our shop/);
  assert.equal(lesson.includes('href="https://payhip.com/b/6KDfn" download'), false);
  for (const path of [
    "real-code-quest/real-code-quest-level-1.pdf",
    "pocket-games/pocket-games-level-1.pdf",
    "level-1/level-1-spark.pdf",
  ]) {
    const bytes = readFileSync(path);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", path);
    assert.ok(bytes.length > 1000, path);
  }
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
  for (const path of ["index.html", "level-1/index.html", "book/index.html", "404.html", "real-code-quest/index.html", "pocket-games/index.html"]) {
    assert.match(read(path), /href="\/star-catcher\/">Star Catcher</, path);
  }
});

test("coming soon books are listed and link the Star Catcher practice file", () => {
  const quest = read("real-code-quest/index.html");
  const pocket = read("pocket-games/index.html");
  const home = read("index.html");
  const book = read("book/index.html");
  const sitemap = read("sitemap.xml");
  const llms = read("llms.txt");
  for (const html of [quest, pocket]) {
    assert.match(html, /Coming soon/);
    assert.match(html, /href="\/level-1\/"/);
    assert.match(html, /href="\/level-1\/level-1-spark\.pdf"/);
    assert.match(html, /data-measure-event="level1_pdf_click"/);
    assert.match(html, /hello@levelupmakers\.com/);
    assert.match(html, /href="\/contact\/"/);
    assert.match(html, /href="\/star-catcher\/"/);
    assert.equal(html.includes("<form"), false);
    assert.equal(html.includes("<video"), false);
    assert.equal(html.includes("grandmother"), false);
    assert.equal(html.includes("grandson"), false);
    assert.equal(html.includes("level-up-promo"), false);
  }
  assert.match(quest, /\$19/);
  assert.match(quest, /\$34\.99/);
  assert.match(quest, /Godot 4/);
  assert.match(quest, /GDScript/);
  assert.match(quest, /Chromebook/);
  assert.match(quest, /JavaScript/);
  assert.match(quest, /Python/);
  assert.match(quest, /Star Catcher/);
  assert.match(quest, /not for sale yet/i);
  assert.match(pocket, /GB Studio/);
  assert.match(pocket, /Price coming soon/);
  assert.match(pocket, /Windows, Mac, or Linux/);
  assert.match(pocket, /ten levels/i);
  assert.match(home, /href="\/real-code-quest\/"/);
  assert.match(home, /href="\/pocket-games\/"/);
  assert.match(home, /href="\/star-catcher\/"/);
  assert.match(book, /href="\/real-code-quest\/"/);
  assert.match(book, /href="\/pocket-games\/"/);
  assert.match(sitemap, /https:\/\/levelupmakers\.com\/real-code-quest\//);
  assert.match(sitemap, /https:\/\/levelupmakers\.com\/pocket-games\//);
  assert.match(llms, /https:\/\/levelupmakers\.com\/real-code-quest\//);
  assert.match(llms, /https:\/\/levelupmakers\.com\/pocket-games\//);
  assert.match(llms, /https:\/\/levelupmakers\.com\/star-catcher\//);
  assert.equal(llms.includes("That file is not on this site yet"), false);
  assert.equal(read("terms/index.html").includes("Level Up 2 and Level Up 3 are coming soon, and they do not have prices yet."), false);
  assert.equal(read("refunds/index.html").includes("Level Up 2 and Level Up 3 do not have prices yet."), false);
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

test("real code quest practice files are free downloads", () => {
  const page = read("real-code-quest/index.html");
  const body = page.split("<footer>")[0];
  const sitemap = read("sitemap.xml");
  const llms = read("llms.txt");
  const names = [
    "hero.png",
    "level-05-starter.zip",
    "level-05-finished.zip",
    "level-06-starter.zip",
    "level-06-finished.zip",
    "level-07-starter.zip",
    "level-07-finished.zip",
    "level-08-starter.zip",
    "level-08-finished.zip",
    "level-09-starter.zip",
    "level-09-finished.zip",
    "level-10-starter.zip",
    "level-10-finished.zip",
  ];
  for (const name of names) {
    const href = `/downloads/real-code-quest/${name}`;
    const escapedHref = href.replaceAll(".", "\\.");
    const escapedName = name.replaceAll(".", "\\.");
    assert.match(page, new RegExp(`href="${escapedHref}" download="${escapedName}"`), name);
    assert.match(sitemap, new RegExp(`https://levelupmakers\\.com${escapedHref}`), name);
    const bytes = readFileSync(`downloads/real-code-quest/${name}`);
    if (name.endsWith(".png")) {
      assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", name);
    } else {
      assert.equal(bytes.subarray(0, 2).toString(), "PK", name);
    }
    assert.ok(bytes.length > 100, name);
  }
  assert.match(page, /Practice files/);
  assert.match(page, /href="\/star-catcher\/"/);
  assert.match(llms, /downloads\/real-code-quest/);
  assert.equal(body.includes("grandmother"), false);
  assert.equal(body.includes("grandson"), false);
});
