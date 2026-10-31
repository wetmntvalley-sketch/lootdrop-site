# Level Up Makers

Parent-run site for the manual **Level Up: Make Your First Game with AI**. Plain static HTML. No framework, no build step, and no dependencies.

The homepage is the parent overview. Level 1, the free chapter, is at `/level-1/`. Old `/jr/` addresses redirect there.

## Do not merge the domain change early

`CNAME` is `levelupmakers.com`. Merge that only after Porkbun DNS for levelupmakers.com points at GitHub Pages. Merging sooner will take lootdrop.tools off this repository before the new domain answers.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Homepage for parents: learning path, safety, and planned prices. |
| `level-1/index.html` | Free Level 1 chapter, ready to print. |
| `blog/` | Blog index and three posts for parents. |
| `jr/index.html`, `jr/level-1/index.html` | Redirect stubs to `/` and `/level-1/`. |
| `archive/` | Earlier Loot Drop pages (The Drop, Armory, Respawn, old homepage). `noindex`, and blocked in `robots.txt`. |
| `terms/`, `privacy/`, `refunds/` | Current policies. Nothing is for sale yet. |
| `llms.txt` | Plain-language summary for AI assistants. |
| `robots.txt`, `sitemap.xml` | Crawling rules and the public URL list for levelupmakers.com. |
| `assets/style.css`, `assets/site.js` | Shared styles and the footer year plus copy buttons. |
| `404.html` | Not-found page. |
| `CNAME` | GitHub Pages hostname. |

The full manual is an early-bird pre-order on Payhip. The Parent + Student bundle is marked Coming Nov 16 and has no buy link.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
