# Level Up Makers

Parent-run site for the manual **Level Up: Make Your First Game with AI**. Plain static HTML. No framework, no build step, and no dependencies.

The homepage is the parent overview. Level 1, the free chapter, is at `/level-1/`. The printable file for that chapter is `/level-1/level-1-spark.pdf`. Old `/jr/` addresses redirect there.

A coarse visit and click count is described in `MEASUREMENT.md`. The website stays on GitHub Pages. The count is a small Cloudflare Worker, `levelupmakers-count`, which the owner deploys once. It does not require moving the site to Workers or Pages.

## Do not merge the domain change early

`CNAME` is `levelupmakers.com`. Merge that only after Porkbun DNS for levelupmakers.com points at GitHub Pages. Merging sooner will take lootdrop.tools off this repository before the new domain answers.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Homepage for parents: learning path, safety, and prices. |
| `book/index.html` | Book page: Amazon paperback and Payhip PDF. |
| `real-code-quest/index.html` | Coming soon page for Level Up 2: Real Code Quest. Planned PDF $19, planned paperback $34.99. Not for sale yet. |
| `pocket-games/index.html` | Coming soon page for Level Up Makers: Pocket Games. Price coming soon. |
| `review/index.html` | Email gate for adult reviewers. The PDF delivery hook is not connected yet. |
| `printables/index.html` | Live page listing the printables in the $29 Parent + Student bundle. The worksheet files are in the bundle download, not on this page. |
| `level-1/index.html` | Free Level 1 chapter, ready to print. |
| `level-1/level-1-spark.pdf` | Printable PDF of that same chapter. Not the 178-page manual. |
| `from/homeschool-classifieds/` | Classified-ad path. Opens the free chapter. |
| `functions/` | Shared count rules, plus Pages Functions for local `wrangler pages dev`. Production counting uses the Worker. |
| `worker/index.js` | The counter Worker. GitHub Pages calls it. See `MEASUREMENT.md`. |
| `wrangler.worker.jsonc` | Worker name, Analytics Engine binding, and deploy config. |
| `assets/measure.js` | Browser counter. Sends an event name and a short source label. |
| `MEASUREMENT.md` | What to create in Cloudflare, and how to read totals. |
| `blog/` | Blog index and six posts for parents. |
| `jr/index.html`, `jr/level-1/index.html` | Redirect stubs to `/` and `/level-1/`. |
| `archive/` | Earlier Loot Drop pages (The Drop, Armory, Respawn, old homepage). `noindex`, and blocked in `robots.txt`. |
| `terms/`, `privacy/`, `refunds/` | Current policies. |
| `contact/` | Contact page with a copyable email address. No form. |
| `llms.txt` | Plain-language summary for AI assistants. |
| `robots.txt`, `sitemap.xml` | Crawling rules and the public URL list for levelupmakers.com. |
| `assets/style.css`, `assets/site.js` | Shared styles and the footer year plus copy buttons. |
| `404.html` | Not-found page. |
| `CNAME` | GitHub Pages hostname. |

The paperback is $34.99 on Amazon: https://www.amazon.com/dp/B0HQDMJ24G. The complete PDF is $15 and available now for immediate download on Payhip: https://payhip.com/b/6KDfn. The Parent + Student bundle is $29 and available now for immediate download on Payhip: https://payhip.com/b/NsL1H.

## Local preview

The static pages, including the PDF:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

The live count is the Worker in `worker/index.js`. Deploy that with the command in `MEASUREMENT.md`. The static server above does not run it. `assets/measure.js` only sends counts from levelupmakers.com, so a local preview stays quiet.

`wrangler.jsonc` is still the local Pages Functions config. It omits `pages_build_output_dir` so it does not take over a Pages project. The production site is GitHub Pages, not Pages Functions.

Rebuild the Level 1 PDF from the chapter page after editing `level-1/index.html`:

```
node scripts/build-level1-pdf.mjs
```

Run the function tests:

```
node --experimental-default-type=module --test test/*.test.js
```
