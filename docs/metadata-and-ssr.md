# Metadata & SSR Architecture

**Created**: 2026-02-17
**Updated**: 2026-03-03

## Related

- Metadata helper: `components/MetaData.tsx` — `buildMetadata()`
- CMS pages: `app/[lang]/[[...slug]]/page.tsx` — `generateMetadata()`
- Event detail: `app/[lang]/events/[...slug]/page.tsx` — `generateMetadata()`
- News detail: `app/[lang]/news/[...slug]/page.tsx` — `generateMetadata()`

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
| `imageWidth`      | `number`          | OG image width in px (optional)          |
| `imageHeight`     | `number`          | OG image height in px (optional)         |
| `type`            | `string`          | OG type (`website` or `article`)         |
| `path`            | `string`          | URL path (without locale prefix)         |
| `locale`          | `string`          | Language code (e.g. `en`, `fr`)          |

Returns a Next.js `Metadata` object with `title`, `description`, `keywords`, `alternates.canonical`, `openGraph`, and `robots`.

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
3. Uses news `cover` image as OG image when available
4. Passes `type: "article"` and `path: "news/<slug>"` to `buildMetadata()`

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

## Environment Variables

| Variable                  | Usage                          |
|---------------------------|--------------------------------|
| `NEXT_PUBLIC_BASE_URL`    | Canonical URL prefix           |
| `NEXT_PUBLIC_SITE_NAME`   | Default title / og:site_name   |
