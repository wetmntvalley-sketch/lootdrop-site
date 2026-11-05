# Level 1 measurement

This site stays a static Cloudflare Pages project. The count is a Pages Function, not a Worker migration and not Cloudflare Web Analytics. Web Analytics does not support UTM parameters or custom events, so the classified ad uses its own path.

Nothing here was deployed, and no Cloudflare account setting was changed.

## What is counted

| Event (`blob1`) | Source (`blob2`) | When it is written |
|---|---|---|
| `level1_visit` | `site` | The browser loads `/level-1/` without the classified-ad marker. |
| `level1_visit` | `homeschool-classifieds` | The browser loads `/level-1/` in the same page view as the classified-ad link. |
| `level1_pdf_click` | `site` or `homeschool-classifieds` | A click on **Download the free Level 1 PDF**. |
| `campaign_visit` | `homeschool-classifieds` | A `GET` request to the classified-ad path. The function writes this. The public endpoint cannot. |

Each stored point is those two labels, the number `1`, and the time Analytics Engine assigns in UTC. The public endpoint accepts only `level1_visit` and `level1_pdf_click`, and only the sources `site` and `homeschool-classifieds`. Extra fields are rejected. The response is empty. There is no public read API.

The classified-ad URL to paste later is:

`https://levelupmakers.com/from/homeschool-classifieds`

It opens the free Level 1 chapter. It does not open the Payhip manual. The PDF at `/level-1/level-1-spark.pdf` is that same free chapter.

## What the owner configures once

1. Confirm the Pages project serves this repository. On 5 November 2026, `levelupmakers.com` still answered from GitHub Pages (`server: GitHub.com`, Porkbun DNS, GitHub Pages A records `185.199.108.153`–`185.199.111.153`). The PDF and the static classified-ad redirect work there. The function does not run, and the count is not stored, until Cloudflare Pages is the host. Do not move this project to Workers.
2. Pages build settings for this repository: no build command, build output directory `/` (the repository root). `package.json` is not part of this site. Do not add a build step.
3. In the Cloudflare dashboard, open **Workers & Pages**, select this Pages project, then **Settings > Bindings > Add > Analytics engine**. Do this for **Production**.
   - Variable name: `LEVEL1_EVENTS`
   - Dataset: `level1_events`
4. Redeploy the project so the binding is attached. The dataset is created on the first accepted write. There is no separate create step.
5. Leave `wrangler.jsonc` without `pages_build_output_dir`. That keeps the file local-only. Adding `pages_build_output_dir` makes the file the source of truth and can overwrite dashboard settings on the next deploy. If you later choose that, run `npx wrangler pages download config` first and compare.

Counts are written only for `levelupmakers.com`, `www.levelupmakers.com`, and local dev hosts. A `pages.dev` preview redirects to the free chapter and does not write.

`_routes.json` invokes Functions only for `/api/measure` and `/from/homeschool-classifieds`. Other files stay static.

## How to view totals

The site does not show totals. Use an API token with **Account > Account Analytics > Read**. The account ID is on the dashboard overview. Replace both placeholders:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/analytics_engine/sql" \
  --header "Authorization: Bearer API_TOKEN" \
  --data "SELECT blob1 AS event, blob2 AS source, SUM(_sample_interval) AS total FROM level1_events WHERE timestamp > NOW() - INTERVAL '30' DAY GROUP BY event, source ORDER BY event, source"
```

`SUM(_sample_interval)` is the count Cloudflare documents for sampled data. This site should stay unsampled. A daily breakdown:

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

`SHOW TABLES` lists the dataset after the first write. Retention is about 90 days. `campaign_visit` is the classified-ad total. `level1_visit` with source `homeschool-classifieds` is the lesson view after that redirect, in that same page load.

## Limits

- A PDF event is a click on the download link, not a completed download. A click still counts if the file fails or the visitor cancels.
- Lesson views and PDF clicks need JavaScript. The classified-ad path does not. Visitors who block `/api/measure` are missing from the lesson and PDF totals.
- Reloading Level 1 counts another lesson view. The classified-ad source is remembered only for that page load, in memory. It is not a cookie. A later visit without the ad path counts as `site`.
- The classified-ad total counts each `GET` to that path, including a refresh or a bot. `HEAD` does not count.
- A modified browser on this site can send the two public events. It cannot store an arbitrary name, an IP address, a browser type, or a personal identifier. Trust `campaign_visit` for the ad path.
- Host logs at GitHub Pages today, and at Cloudflare when Pages is the host, can still include IP address and browser type. Those logs are not copied into this dataset.
- The count is not tied to a person, so one visit cannot be deleted. Points age out after about 90 days.
