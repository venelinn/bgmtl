# Contentful-driven sitemap — portable strategy

**Goal:** a `sitemap.xml` that (a) auto-includes your Contentful pages **without a
rebuild**, (b) emits **hreflang** alternates for multilingual sites, (c) carries
real **`lastModified`** dates, and (d) is **cached** so generating it costs ~0
Contentful API calls.

Companion to `CONTENTFUL-CACHING-STRATEGY.md` — it reuses the same
`cachedContentful` wrapper, so install that first (or at least copy
`lib/contentful-cache.ts`).

---

## What your site does today (detected)

`bgottawa-gatineau.ca/sitemap.xml` is a **`<sitemapindex>` → `/sitemap-0.xml`** —
the signature of **`next-sitemap`** (a build-time generator). That means:

- The sitemap only updates **on a full rebuild**, not when you publish in
  Contentful.
- You have a **locale prefix** (`/en` seen; Ottawa-Gatineau → you likely also
  have `/fr`) but **no `hreflang`** alternates in the output — a missed
  bilingual-SEO signal.

This strategy replaces that with the native runtime `app/sitemap.ts`, driven by
Contentful and cached.
i

---

## How it works

```
crawler → GET /sitemap.xml
   app/sitemap.ts  (export const revalidate = 3600 — regenerate XML hourly)
        └─ getSitemapPaths()           ← lib/sitemap-paths.ts
             └─ cachedContentful(...)   ← revalidate:false, tag "contentful"
                  └─ fetch published `page` entries per locale  ← only on a real cache miss
   → group by path, emit hreflang alternates + lastModified + priority
```

- The **data** is cached indefinitely (`cachedContentful`). Hourly XML regen =
  a cache **hit** → **0 Contentful calls**. A real CMS fetch happens only after
  the **publish webhook** busts the `contentful` tag (same webhook from the
  caching export).
- New/edited pages appear in the sitemap within ~1 hour of publishing — no
  deploy. (Want it instant? Have the webhook also call
  `revalidatePath("/sitemap.xml")`.)

---

## Files in this export

| File | Put it at | What it does |
|---|---|---|
| `app/sitemap.ts` | `app/sitemap.ts` | the sitemap route — grouping, hreflang, lastModified |
| `lib/sitemap-paths.ts` | `lib/` | `getSitemapPaths()` — cached Contentful fetch (**ADAPT** the fetch) |
| `app/robots.ts` | `app/robots.ts` | optional — advertises the sitemap |
| (dependency) `lib/contentful-cache.ts` | from the caching export | `cachedContentful` |

---

## Integration steps

1. **Install the caching export first** (you need `cachedContentful`).
2. **Copy `lib/sitemap-paths.ts`** and fill in the `ADAPT` block — your
   Contentful client, the content type(s) that map to URLs, and your CMS→app
   locale mapping. Set `EXCLUDED_SLUGS` for anything that shouldn't be indexed.
3. **Set `SITEMAP_LOCALES`** (in `sitemap-paths.ts`) to your locales: `["en",
   "fr"]` for bilingual, or `[""]` for a single-locale site with no `/locale`
   prefix. `app/sitemap.ts` reads the same constant.
4. **Copy `app/sitemap.ts`** (and `app/robots.ts` if you want it). Set
   `NEXT_PUBLIC_BASE_URL` to your canonical origin (e.g.
   `https://bgottawa-gatineau.ca`).
5. **Remove `next-sitemap`** — don't ship two sitemaps. Delete its
   `postbuild` script (`package.json`), `next-sitemap.config.js`, and any
   generated `public/sitemap*.xml` / `public/robots.txt` (the native
   `app/robots.ts` + `app/sitemap.ts` take over those routes). If you still want
   `next-sitemap` for non-CMS static routes, scope each tool to different paths
   and use a sitemap index — but the simplest, freshest setup is to let
   `app/sitemap.ts` own it.
6. **Deploy**, then verify.

---

## Verify

```bash
curl -s https://bgottawa-gatineau.ca/sitemap.xml | head -40
```

You should see `<urlset>` (not a `<sitemapindex>`) with `<url>` entries, each
`<loc>`, `<lastmod>`, and — for pages that exist in more than one locale —
`<xhtml:link rel="alternate" hreflang="…">` blocks. Then:

- Publish a page in Contentful → within ~1h (or immediately if the webhook
  revalidates `/sitemap.xml`) it appears in the sitemap, no rebuild.
- Contentful **Usage** dashboard: crawlers hitting `/sitemap.xml` add ~0 calls
  (cached); you see a small bump only after a publish.

---

## Gotchas

- **One sitemap source only.** `next-sitemap` and `app/sitemap.ts` both try to
  own `/sitemap.xml` — remove or scope one (step 5).
- **`getSitemapPaths` must be cached** (it is, via `cachedContentful`). If you
  bypass the wrapper, every crawler hit on `/sitemap.xml` becomes a burst of
  Contentful calls — the opposite of the goal.
- **hreflang only emits when a page exists in 2+ locales** — by design (a
  single-locale page needs no alternates). If your EN and FR pages don't share
  the same `pathSegments`, they won't be linked as alternates; normalize slugs
  or add an explicit mapping in `fetchSitemapPaths`.
- **`lastModified`** comes from Contentful `sys.updatedAt`. If you want it to
  reflect non-CMS changes too, merge in a build timestamp.
- **Large sites (>50k URLs / >50MB):** the sitemap spec requires splitting into
  a sitemap index. Native `app/sitemap.ts` supports `generateSitemaps()` for
  chunking — add it only if you approach those limits.

---

*Exported from the dream-boats / ziboat Next.js + Contentful setup
(`app/sitemap.ts`, `app/robots.ts`, `getContentfulSitemapPaths`).*
