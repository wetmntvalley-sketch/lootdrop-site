# Visit and click counts

The website stays on GitHub Pages. Counts are sent to a small Cloudflare Worker, then stored in Workers Analytics Engine. Cloudflare Web Analytics is free, but it cannot count a PDF click or a notify click, and it does not support custom events. This Worker can, and the Workers Free plan includes it.

Nothing here is deployed by the repository. No Cloudflare account setting is changed until you run the deploy command below.

## What you create

Create these exactly. There is no API token, site token, or other secret to paste into the site.

| What | Value the code expects |
|---|---|
| Worker name | `levelupmakers-count` |
| workers.dev subdomain | `levelupmakers` |
| Public URL | `https://levelupmakers-count.levelupmakers.workers.dev/measure` |
| Analytics Engine binding | `LEVEL1_EVENTS` |
| Analytics Engine dataset | `level1_events` |
| Deploy config | `wrangler.worker.jsonc` |

The dataset is created the first time a count is accepted. There is no separate “create dataset” step. The binding is declared in `wrangler.worker.jsonc`, so the deploy command attaches it.

Workers Free includes 100,000 Worker requests a day and 100,000 Analytics Engine writes a day. Cloudflare’s current pricing page says Analytics Engine is not billed yet. A site of this size stays inside the free allowance. Do not move levelupmakers.com off GitHub Pages, and do not add a Workers route on the main hostname.

### Deploy

1. In the Cloudflare dashboard, open **Workers & Pages**. If **Your subdomain** is not already set, set it to `levelupmakers`. The site calls `levelupmakers-count.levelupmakers.workers.dev`. If you already use a different workers.dev subdomain, do not rename it. Instead, change the one URL in `assets/measure.js` to `https://levelupmakers-count.<that-subdomain>.workers.dev/measure` and deploy the Worker under the name `levelupmakers-count`.
2. From this repository, after `npx wrangler login`:

```bash
npx wrangler deploy --config wrangler.worker.jsonc
```

3. Confirm the command prints `https://levelupmakers-count.levelupmakers.workers.dev`. That is the address `assets/measure.js` already uses. Do not add a Web Analytics beacon token.
4. Deploy the Worker before this site change is merged. Until the Worker exists, the pages still load, and the browser’s count request fails quietly.

Leave `wrangler.jsonc` as it is. That file is only for a local Pages Functions preview. It is not the production counter.

## What is counted

The browser sends two fields: `event` and `source`. The Worker stores those two labels, the number `1`, and the time Analytics Engine assigns in UTC. It does not read the Referer header, an IP address, a browser type, or a cookie into the dataset.

| Event (`blob1`) | Source (`blob2`) | When it is written |
|---|---|---|
| `page_visit` | A short label, below | A public page that loads `/assets/measure.js` finishes loading on levelupmakers.com. |
| `level1_visit` | The same label as that page | The browser loads `/level-1/`. |
| `level1_pdf_click` | The same label as that page | A click on **Download the free Level 1 PDF**. The file URL is unchanged: `/level-1/level-1-spark.pdf`. |
| `notify_click` | The same label as that page | A click on a coming-soon **Get notified**, **Email us**, or notify **contact page** link. |
| `campaign_visit` | `homeschool-classifieds` | Only if the old Pages Function runs. GitHub Pages does not run it. Use `page_visit` with that source instead. |

Source labels:

| Label | Meaning |
|---|---|
| `facebook` | The visit came from Facebook or Messenger, or the link used `?from=facebook`. |
| `instagram` | The visit came from Instagram. |
| `direct` | The browser sent no referring site. |
| `site` | The visitor moved from one Level Up Makers page to another, and no earlier label was kept. |
| `other` | Some other site. The hostname is not stored. |
| `homeschool-classifieds` | The visit used `/from/homeschool-classifieds`. |

The browser classifies the referring site and sends only the label. A referring address such as `https://l.facebook.com/l.php?email=…` becomes `facebook`. The path and query are not sent.

Facebook’s app often sends no referring site. For a post in a Facebook group, use either of these links so the visit still counts as Facebook:

- `https://levelupmakers.com/from/facebook`
- `https://levelupmakers.com/real-code-quest/?from=facebook`
- `https://levelupmakers.com/pocket-games/?from=facebook`

That label is remembered in session storage for the open tab, so a later PDF click in the same tab stays `facebook`. It is not a cookie. Closing the tab clears it.

The Worker accepts a count only from `https://levelupmakers.com`, `https://www.levelupmakers.com`, or local `http://localhost` / `http://127.0.0.1`. The public endpoint accepts only the events in the table above, except `campaign_visit`. Extra fields are rejected.

## How to view totals

The site does not show totals. Use an API token with **Account > Account Analytics > Read**. The account ID is on the dashboard overview. Replace both placeholders:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer API_TOKEN" \
  --data "SELECT blob1 AS event, blob2 AS source, SUM(_sample_interval) AS total FROM level1_events WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY event, source ORDER BY event, source"
```

`SUM(_sample_interval)` is the count Cloudflare documents for sampled data. This site should stay unsampled. Facebook traffic is the `page_visit` rows whose source is `facebook`. PDF clicks from those visits are `level1_pdf_click` with the same source.

A daily breakdown:

```sql
SELECT formatDateTime(timestamp, '%Y-%m-%d', 'Etc/UTC') AS day,
       blob1 AS event,
       blob2 AS source,
       SUM(_sample_interval) AS total
FROM level1_events
WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY day, event, source
ORDER BY day, event, source
```

Retention is about 90 days.

## Limits

- A PDF event is a click on the download link, not a completed download. The PDF file is still the static file on GitHub Pages. It does not pass through the Worker.
- A notify event is a click, not an email sent. Mailto links open the visitor’s own mail program.
- Visits and clicks need JavaScript. Visitors who block the Worker are missing from the totals.
- Reloading a page counts another visit.
- A modified browser can send the allowlisted events. It cannot store an arbitrary name, a full referring address, an IP address, or a personal identifier.
- GitHub Pages logs, and Cloudflare’s Worker logs, can still include an IP address and a browser type. Those logs are not copied into this dataset.
- The count is not tied to a person, so one visit cannot be deleted. Points age out after about 90 days.
