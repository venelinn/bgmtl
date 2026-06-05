# Metadata & SSR Architecture

**Created**: 2026-02-17
**Updated**: 2026-06-05

## Related

- Metadata helper: `components/MetaData.tsx` — `buildMetadata()`
- Indexability gate: `utils/seo.ts` — `isIndexableEnv()`
- Structured data: `utils/structuredData.ts` — `buildEventJsonLd()` + `components/JsonLd.tsx`
- CMS pages: `app/[lang]/[[...slug]]/page.tsx` — `generateMetadata()`
- Event detail: `app/[lang]/events/[...slug]/page.tsx` — `generateMetadata()` + Event JSON-LD
- News detail: `app/[lang]/news/[...slug]/page.tsx` — `generateMetadata()`
- robots / sitemap: `app/robots.ts`, `app/sitemap.ts`

## Overview

All pages use the Next.js App Router `generateMetadata` API instead of the legacy `<Head>` / `useRouter` pattern from Pages Router. A shared `buildMetadata()` utility constructs the `Metadata` object from Contentful or API data.

## How It Works

### `buildMetadata()` utility

Located in `components/MetaData.tsx`. Accepts:

| Param             | Type              | Description                              |
|-------------------|-------------------|------------------------------------------|
| `pageTitle`       | `string \| null`  | Page title; falls back to `SITE_NAME`    |
| `pageDescription` | `string \| null`  | Meta description                         |
| `keywords`        | `string \| null`  | Meta keywords                            |
| `image`           | `string \| null`  | OG image URL; falls back to default      |
| `imageWidth`      | `number`          | OG image width in px (defaults to 1200)  |
| `imageHeight`     | `number`          | OG image height in px (defaults to 630)  |
| `imageAlt`        | `string \| null`  | `og:image:alt`; falls back to the title  |
| `type`            | `string`          | OG type (`website` or `article`)         |
| `path`            | `string`          | URL path (without locale prefix)         |
| `locale`          | `string`          | Language code (e.g. `en`, `fr`)          |

Returns a Next.js `Metadata` object with `title`, `description`, `keywords`, `alternates.canonical`, `openGraph`, and `robots`.

The `openGraph.images[0]` it emits is hardened for Facebook's requirements:

- **Forced `https`** — a stray `http://` URL (or `http` `BASE_URL` fallback) is rewritten, since Facebook rejects non-secure image URLs. Both `og:image` and `og:image:secure_url` are emitted.
- **Dimensions always present** — `width`/`height` default to **1200×630** (1.91:1) when not passed.
- **`og:image:alt`** and **`og:image:type`** — the MIME type is inferred from the URL extension, defaulting to `image/jpeg` (the Cloudinary OG transform forces `f_jpg`).

`robots` is gated by `isIndexableEnv()` — see [Indexability & staging](#indexability--staging).

### Per-page metadata sources

| Route                              | Source                              | Dynamic? |
|------------------------------------|-------------------------------------|----------|
| `[lang]/[[...slug]]`               | Contentful `metaData` linked entry  | Per-page |
| `[lang]/events/[...slug]`          | Event `venue`, `date`, `cover`      | Per-event |
| `[lang]/news/[...slug]`            | News `heading`, `cover`             | Per-article |

## CMS Pages (`[[...slug]]`)

The `generateMetadata` export in `page.tsx`:

1. Resolves params and fetches page data via `getPageBySlug()`
2. Extracts the linked `metaData` entry (Contentful content type: `metaData`)
3. Passes `pageTitle`, `pageDescription`, `keywords` to `buildMetadata()`

The Contentful `metaData` content model has these fields:
- **Title** — internal label (not rendered)
- **Page Title** — used as `<title>` and `og:title`
- **Page Description** — used as `<meta name="description">` and `og:description`
- **Keywords** — used as `<meta name="keywords">`

## Event Detail (`events/[...slug]`)

The `generateMetadata` export:

1. Finds the event by matching the Bulgarian heading slug
2. Builds title from `venue` + `date`, description from `venue`
3. Uses event `cover` image as OG image, resized to 1200×630 via `getOgImageUrl()` (see [OG Image Optimization](#og-image-optimization-for-social-sharing))
4. Passes `type: "article"`, `imageWidth: 1200`, `imageHeight: 630`, and `path: "events/<slug>"` to `buildMetadata()`

## News Detail (`news/[...slug]`)

The `generateMetadata` export:

1. Finds the news item by matching the Bulgarian heading slug
2. Uses the heading text as title and description
3. Uses news `cover` image as OG image, resized to 1200×630 via `getOgImageUrl()` (same as events — this was added 2026-06-05; news previously shipped the raw cover URL with no transform/dimensions)
4. Passes `type: "article"`, `imageWidth: 1200`, `imageHeight: 630`, `imageAlt`, and `path: "news/<slug>"` to `buildMetadata()`

## OG Image Optimization for Social Sharing

Facebook (and most social platforms) recommend an OG image of **1200×630 px** (1.91:1 ratio). The helper `getOgImageUrl()` in `utils/common.ts` transforms a Cloudinary URL to serve a properly sized image on-the-fly without any server-side processing.

### `getOgImageUrl(src)`

Takes an image URL and returns a version resized for social sharing:

- **Cloudinary URLs** — inserts `/c_fill,w_1200,h_630,g_auto,f_jpg,q_80/` into the upload path. `c_fill` crops to exact dimensions, `g_auto` uses smart gravity to keep the subject centred.
- **Non-Cloudinary URLs** — returned as-is (only HTTPS enforced).

### How it flows

```
event.cover[0].src                       (original Cloudinary URL)
       │
       ▼
getOgImageUrl(coverUrl)                  (adds c_fill,w_1200,h_630,g_auto,f_jpg,q_80)
       │
       ▼
buildMetadata({ image, imageWidth: 1200, imageHeight: 630 })
       │
       ▼
<meta property="og:image"        content="https://res.cloudinary.com/.../c_fill,w_1200,h_630,g_auto,f_jpg,q_80/..." />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
```

### Adding OG images to other page types

Use the same pattern for any page that has a cover/hero image:

```typescript
import { getOgImageUrl } from "@/utils/common";

const ogImage = coverUrl ? getOgImageUrl(coverUrl) : null;

return buildMetadata({
  image: ogImage,
  imageWidth: 1200,
  imageHeight: 630,
  // ...other fields
});
```

## Code Pattern

```typescript
import type { Metadata } from "next"
import { buildMetadata } from "@/components/MetaData"
import { getOgImageUrl } from "@/utils/common"

export async function generateMetadata(props: {
  params: Promise<{ lang: string; /* ... */ }>
}): Promise<Metadata> {
  const { lang } = await props.params
  // fetch data...
  const ogImage = coverUrl ? getOgImageUrl(coverUrl) : null;
  return buildMetadata({
    pageTitle: "...",
    pageDescription: "...",
    image: ogImage,          // OG image URL (optional)
    imageWidth: 1200,        // Facebook recommended (optional)
    imageHeight: 630,        // Facebook recommended (optional)
    type: "website",         // or "article" for detail pages
    path: "...",
    locale: lang,
  })
}
```

## Structured Data (JSON-LD)

Added 2026-06-05. Server-rendered schema.org markup so Google can show rich results
(event date/time/location, article cards). Two pieces:

- **`components/JsonLd.tsx`** — `<JsonLd data={...} />`, a server component that renders
  a `<script type="application/ld+json">`. Keep it in **server** components so crawlers
  see it on first paint (it is not interactive).
- **`utils/structuredData.ts`** — pure builders that map our data models to schema.org
  objects. They only emit fields they can actually populate (no empty/`undefined` keys),
  so partial-data entries still produce valid markup.

| Builder                          | Page                          | Type        |
|----------------------------------|-------------------------------|-------------|
| `buildEventJsonLd(event, locale)`        | `events/[...slug]` (detail)   | `Event`     |
| `buildEventsItemListJsonLd(events, locale)` | `events` (listing)         | `ItemList` of `Event` |
| `buildArticleJsonLd(news, locale)`       | `news/[...slug]` (detail)     | `NewsArticle` |

### Event mapping

| Schema field            | Source                              |
|-------------------------|-------------------------------------|
| `name`                  | event heading (→ venue fallback)    |
| `startDate`             | `event.date` (ISO local datetime)   |
| `doorTime`              | `event.doorsOpen`                   |
| `location` (`Place`)    | `event.venue` + `GeoCoordinates` from `event.address.lat/lon` |
| `image`                 | `cover` → `getOgImageUrl()` (1200×630) |
| `description`           | `excerpt` → `content` → fallback (rich text flattened to plain text) |
| `offers` (`Offer`)      | `event.ticket.url` + parsed `event.price` (currency hardcoded **CAD**) |
| `organizer`             | `NEXT_PUBLIC_SITE_NAME` / base URL  |
| `eventStatus` / `eventAttendanceMode` | `EventScheduled` / `OfflineEventAttendanceMode` |

The events **listing** wraps one `Event` node per event in an `ItemList`, reusing the same
node builder (without its own `@context`).

### NewsArticle mapping

`headline` (heading, truncated to ≤110 chars), `image`, `datePublished` (`news.date`),
`dateModified` (`news._updatedAt` → `news.date`), `description`, `mainEntityOfPage`,
`author`/`publisher` (both the site Organization).

### Notes / gotchas

- **Slugs are derived inside the builder** from the Bulgarian heading (`detailSlug()`) —
  must stay in sync with the `generateStaticParams` / detail-page matchers. Same scheme as
  the sitemap so URLs match.
- **Currency is hardcoded `CAD`** and **price is parsed from free text** (`"From $49"` →
  `"49"`). Per the JSON-LD price guardrail the value must match the visible price; this
  takes the first number (the "from" figure). No clean number → `price` omitted, offer
  still carries the ticket URL.
- **No `endDate`** (not in the model) and **no publisher `logo`** — both are *recommended*
  by Google but not required; rich results still validate. Add when a logo asset / end time
  becomes available.
- **Validate** with Google's [Rich Results Test](https://search.google.com/test/rich-results)
  after deploy.

## Indexability & staging

`utils/seo.ts` `isIndexableEnv(baseUrl?)` returns `false` when the `NEXT_PUBLIC_BASE_URL`
host contains a non-production marker (`develop.`, `staging.`, `preview.`, `localhost`,
`.vercel.app`). Wired into **two** layers so they stay consistent:

- **`app/robots.ts`** — non-prod hosts get `Disallow: /` (and the sitemap/host lines are dropped).
- **`buildMetadata`** — non-prod pages emit `robots: { index: false, follow: false }`.

So `develop.bgmtl.com` is blocked both at robots.txt and per-page `<meta name="robots">`.
Add new staging host patterns to `NON_INDEXABLE_MARKERS` if the naming scheme changes.

## Environment Variables

| Variable                  | Usage                          |
|---------------------------|--------------------------------|
| `NEXT_PUBLIC_BASE_URL`    | Canonical URL prefix; also drives indexability (`isIndexableEnv`) |
| `NEXT_PUBLIC_SITE_NAME`   | Default title / og:site_name; JSON-LD organizer/publisher name |
