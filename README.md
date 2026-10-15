# Loot Drop: site

> Weekly loot for AI builders. Tested tools, ready-made templates, and fixes when your build breaks.

This is the one-page marketing site for **Loot Drop**. It's plain static HTML with no framework, build step, or dependencies. It covers the brand's three products:

- **The Drop**: a free weekly AI-tools digest with S/A/B/C tier lists, tested by use case.
- **The Armory**: agent templates and prompt packs (coming soon, with a waitlist form).
- **Respawn**: vibe-code rescue for broken AI-built apps (intake form).

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole site. CSS and JS are inline, and the logo is an inline SVG sprite (`#chest`). |
| `404.html` | Not-found page in the same style. Cloudflare Pages serves it automatically. |
| `favicon.svg` | Logo file, referenced by the JSON-LD `logo` field. |
| `llms.txt` | Plain-language summary for AI assistants and LLM crawlers ([llmstxt.org](https://llmstxt.org)). |
| `robots.txt` | Allows all crawlers, including AI crawlers, and points to the sitemap. |
| `sitemap.xml` | Sitemap for search engines. |

## Placeholders to replace before launch

| Placeholder | Where | Replace with |
|---|---|---|
| `YOUR_KIT_FORM_ID` (2×) | `index.html`: the Join The Drop form and the Armory notify form | Your Kit form ID (Kit → Grow → Landing Pages & Forms → form → Embed → HTML; the number in `app.kit.com/forms/<ID>/subscriptions`) |
| `YOUR_FORM_ID` | `index.html`: the Respawn intake form | Your Formspree form ID (`formspree.io/f/<ID>`) |
| `https://lootdrop.tools` | `index.html` (canonical, Open Graph, JSON-LD), `llms.txt`, `robots.txt`, `sitemap.xml` | The real domain once it's bought, or the `*.pages.dev` URL until then |
| Discord link `href="#"` | `index.html` footer | The Discord invite URL once the server exists |

While a placeholder is still in a form's `action`, submitting that form shows "This form isn't connected yet" and sends nothing.

Quick find: `grep -rn "YOUR_\|lootdrop.tools" .`

## Deploy on Cloudflare Pages (free plan)

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo.
2. Build settings: **Framework preset:** None. **Build command:** leave empty. **Build output directory:** `/`
3. Click **Save and Deploy**. The site goes live at `https://<project>.pages.dev`, and every push to `main` redeploys it.
4. Optional: in **Custom domains**, add the real domain, then update the domain placeholders above.

Each preview branch also gets its own URL. The free plan covers unlimited static requests, and commercial use is allowed.

## Local preview

Open `index.html` in a browser, or run `python3 -m http.server 8000` and visit http://localhost:8000.

## Editorial rules (keep these true on the site)

- Rankings are never for sale. Sponsors can buy a **labeled** ad slot, never a grade.
- Affiliate links are disclosed in the footer, and they never change a ranking.
- Every grade is backed by a dated, hands-on test.
