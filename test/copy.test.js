import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

test("Books is the nav label and the book page lists all three manuals", () => {
  const pages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === "archive" || entry.name.startsWith(".")) continue;
        walk(path);
      } else if (entry.name.endsWith(".html")) {
        pages.push(path);
      }
    }
  };
  walk(".");
  let checked = 0;
  for (const path of pages) {
    const html = read(path);
    if (!html.includes('<nav aria-label="Primary">')) continue;
    const header = html.split("<main")[0];
    const footer = html.split("<footer>")[1] || "";
    assert.match(header, /<nav aria-label="Primary">[\s\S]*href="\/book\/"(?: aria-current="page")?>Books<\/a>/, path);
    assert.equal(header.includes(">The book<"), false, path);
    assert.match(footer, /href="\/book\/"(?: aria-current="page")?>Books<\/a>/, path);
    checked += 1;
  }
  assert.ok(checked >= 15);
  const book = read("book/index.html");
  const listing = book.split('id="books"')[1].split('id="buy"')[0];
  assert.match(listing, /Available now/);
  assert.match(listing, /Level Up: Make Your First Game with AI/);
  assert.match(listing, /\$34\.99/);
  assert.match(listing, /\$15/);
  assert.match(listing, /\$29/);
  assert.match(listing, /Coming soon/);
  assert.match(listing, /href="\/real-code-quest\/"/);
  assert.match(listing, /Level Up 2: Real Code Quest/);
  assert.match(listing, /\$19/);
  assert.match(listing, /not for sale yet/i);
  assert.match(listing, /href="\/pocket-games\/"/);
  assert.match(listing, /Level Up Makers: Pocket Games/);
  assert.match(listing, /Price coming soon/);
  assert.equal(listing.includes("Loot Drop"), false);
  assert.equal(listing.includes("grandmother"), false);
});

test("home page lists every free download and keeps the click counters", () => {
  const home = read("index.html");
  const section = home.split('id="downloads"')[1].split('id="about"')[0];
  assert.match(section, /Free downloads/);
  assert.match(section, /href="\/level-1\/"/);
  assert.match(section, /href="\/level-1\/level-1-spark\.pdf" download="Level-Up-Level-1-Spark\.pdf" data-measure-event="level1_pdf_click"/);
  assert.match(section, /Coming soon/);
  assert.match(section, /href="\/real-code-quest\/"/);
  assert.match(section, /href="\/real-code-quest\/real-code-quest-level-1\.pdf" download="Real-Code-Quest-Level-1\.pdf" data-measure-event="real_code_quest_level1_pdf_click"/);
  assert.match(section, /href="\/pocket-games\/"/);
  assert.match(section, /Price coming soon/);
  assert.match(section, /href="\/pocket-games\/pocket-games-level-1\.pdf" download="Pocket-Games-Level-1\.pdf" data-measure-event="pocket_games_level1_pdf_click"/);
  assert.match(section, /href="\/star-catcher\/"/);
  assert.match(section, /href="\/downloads\/star-catcher-practice\.png" download="star-catcher-practice\.png"/);
  assert.match(section, /href="\/real-code-quest\/#practice"/);
  assert.match(read("real-code-quest/index.html"), /<h2 id="practice">Practice files<\/h2>/);
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
    const href = `/downloads/real-code-quest/${name}`.replaceAll(".", "\\.");
    const file = name.replaceAll(".", "\\.");
    assert.match(section, new RegExp(`href="${href}" download="${file}"`), name);
  }
  assert.equal(section.includes("Loot Drop"), false);
  assert.equal(section.includes("grandmother"), false);
  const measure = read("assets/measure.js");
  assert.match(measure, /new URLSearchParams\(location\.search\)\.get\("from"\)/);
  assert.match(measure, /url\.searchParams\.delete\("from"\)/);
  assert.match(home, /src="\/assets\/measure\.js"/);
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

test("facebook and level 1 share cards are set, and public text does not name Loot Drop", () => {
  const share = "https://levelupmakers.com/assets/share.png";
  const facebook = read("from/facebook/index.html");
  const level1 = read("level-1/index.html");
  for (const [path, html] of [["from/facebook/index.html", facebook], ["level-1/index.html", level1]]) {
    assert.match(html, /property="og:title"/, path);
    assert.match(html, /property="og:description"/, path);
    assert.match(html, /property="og:image" content="https:\/\/levelupmakers\.com\/assets\/share\.png"/, path);
    assert.match(html, /property="og:url"/, path);
    assert.match(html, /property="og:type" content="website"/, path);
    assert.match(html, /name="twitter:card" content="summary_large_image"/, path);
  }
  assert.match(facebook, /rel="canonical" href="https:\/\/levelupmakers\.com\/"/);
  assert.match(facebook, /property="og:url" content="https:\/\/levelupmakers\.com\/"/);
  assert.match(facebook, /http-equiv="refresh" content="0; url=\/\?from=facebook"/);
  assert.match(facebook, /location\.replace\("\/\?from=facebook"\)/);
  assert.match(level1, /property="og:url" content="https:\/\/levelupmakers\.com\/level-1\/"/);
  const png = readFileSync("assets/share.png");
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);

  const skipDir = new Set([".git", "node_modules", "test", "worker", "functions", "scripts"]);
  const skipFile = new Set(["README.md", "MEASUREMENT.md"]);
  const textExt = new Set([".html", ".txt", ".xml", ".css", ".js", ".svg", ".md", ".json"]);
  const brand = /loot[\s-]?drop/i;
  const htmlPages = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipDir.has(entry.name)) continue;
      const path = dir === "." ? entry.name : `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (skipFile.has(entry.name)) continue;
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (!textExt.has(ext)) continue;
      const text = read(path);
      assert.equal(brand.test(text), false, path);
      if (ext === ".html") htmlPages.push(path);
    }
  };
  walk(".");
  assert.ok(htmlPages.includes("from/facebook/index.html"));
  assert.ok(htmlPages.includes("level-1/index.html"));
  for (const path of htmlPages) {
    assert.match(read(path), /property="og:image" content="https:\/\/levelupmakers\.com\//, path);
  }
  assert.equal(share.startsWith("https://levelupmakers.com/"), true);
});
