# Contentful Preview (Draft Mode)

**Created**: 2026-02-25

How the Contentful preview system works end-to-end, from the CMS webhook to rendering draft content in the browser.

## Overview

The app uses **Next.js Draft Mode** (App Router) to toggle between published content (Contentful Delivery API) and draft content (Contentful Preview API). Editors click a preview button in Contentful, which hits an API route that enables draft mode and redirects to the page.

## Architecture

```
Contentful Editor                          Next.js App
     │                                        │
     │  clicks "Open preview"                 │
     │  ─────────────────────────────────►    │
     │  GET /api/preview?secret=X&id=Y&locale=en
     │                                        │
     │                                   ┌────┴─────────────────┐
     │                                   │ 1. Validate secret   │
     │                                   │ 2. draftMode.enable()│
     │                                   │ 3. Resolve entry→path│
     │                                   │ 4. Redirect to page  │
     │                                   └────┬─────────────────┘
     │                                        │
     │  ◄─────────────────────────────────    │
     │  302 redirect → /en/about              │
     │                                        │
     │  Page renders with:                    │
     │  - Preview API (draft content)         │
     │  - Yellow "Preview Mode" banner        │
     │  - "Exit preview" link                 │
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CONTENTFUL_SPACE_ID` | Contentful space identifier |
| `CONTENTFUL_ENVIRONMENT` | Environment (default: `master`) |
| `CONTENTFUL_DELIVERY_TOKEN` | CDN API key — published content only |
| `CONTENTFUL_PREVIEW_TOKEN` | Preview API key — draft + published content |
| `CONTENTFUL_PREVIEW_SECRET` | Shared secret to validate preview requests |
| `CONTENTFUL_HOST` | Preview API host (`preview.contentful.com`) |

## Contentful Client Setup (`utils/content.ts`)

Two Contentful clients are created at module scope:

```typescript
// Published content (CDN)
const deliveryClient = createClient({
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
  space: process.env.CONTENTFUL_SPACE_ID,
  host: "cdn.contentful.com",
});

// Draft content (Preview API)
const previewClient = createClient({
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
  space: process.env.CONTENTFUL_SPACE_ID,
  host: "preview.contentful.com",
});
```

The `getClient(isPreview)` function selects which client to use. If `CONTENTFUL_PREVIEW_TOKEN` is missing, it falls back to the delivery client with a console warning.

### How preview propagates through data fetching

Every data-fetching function accepts an optional `preview` parameter:

```
getPageBySlug(slug, locale, preview)
getHeader(locale, preview)
getFooter(locale, preview)
getAllEvents(locale, preview)
getSiteConfig(locale, preview)
```

These pass `{ preview }` to `getEntries()`, which calls `getClient(preview)` to pick the right Contentful client.

## API Routes

### `GET /api/preview` — Enable Preview

**File**: `app/api/preview/route.js`

**Query params**:
| Param | Required | Description |
|-------|----------|-------------|
| `secret` | Yes | Must match `CONTENTFUL_PREVIEW_SECRET` |
| `id` | Yes | Contentful entry `sys.id` to preview |
| `locale` | No | App locale (default: `"en"`) |

**Flow**:
1. Validates `secret` against `CONTENTFUL_PREVIEW_SECRET` → 401 if invalid
2. Calls `draftMode().enable()` → sets the `__prerender_bypass` cookie
3. Calls `getPreviewPathForEntry(id, locale)` to resolve the entry ID to a URL path
4. Redirects to the resolved path (or `/{locale}` if unresolved)

### `GET /api/exit-preview` — Disable Preview

**File**: `app/api/exit-preview/route.js`

**Query params**:
| Param | Required | Description |
|-------|----------|-------------|
| `path` | No | Path to redirect to after exiting (default: `/`) |

**Flow**:
1. Calls `draftMode().disable()` → clears the bypass cookie
2. Redirects to `path`

## Entry Path Resolution (`getPreviewPathForEntry`)

**File**: `utils/content.ts`

Resolves a Contentful entry ID to a URL path for the redirect. Uses the **preview client** to fetch the entry (since it may be a draft).

Currently supports:
- **`page`** type → builds path from `slug` field with locale prefix

Returns `null` for unsupported content types, so the preview route falls back to the homepage.

## Layout Integration (`[lang]/layout.tsx`)

The layout checks `draftMode().isEnabled` and renders a preview banner:

```
┌──────────────────────────────────────────────────────┐
│  ⚠ Preview Mode Active (Draft Content)  [Exit]      │  ← yellow banner, sticky top
├──────────────────────────────────────────────────────┤
│  Navigation                                          │
│  Page content (fetched via Preview API)              │
│  Footer                                              │
└──────────────────────────────────────────────────────┘
```

The "Exit preview" link points to `/api/exit-preview?path=/{lang}`.

## Page-Level Preview

In `app/[lang]/[[...slug]]/page.tsx`:

```typescript
const { isEnabled } = await draftMode();
const pageData = await getPageBySlug(path, contentfulLocale, isEnabled);
//                                                          ^^^^^^^^^ preview flag
```

The `isEnabled` boolean from `draftMode()` flows into every data fetch, ensuring all content on the page comes from the Preview API when draft mode is active.

## Contentful Webhook Setup

In Contentful, configure the preview URL under **Settings → Content preview**:

```
URL: https://your-domain.com/api/preview?secret={PREVIEW_SECRET}&id={entry.sys.id}&locale={locale}
```

Replace `{PREVIEW_SECRET}` with the value of `CONTENTFUL_PREVIEW_SECRET`.

Contentful substitutes `{entry.sys.id}` and `{locale}` automatically when an editor clicks "Open preview".

## How to Replicate

1. **Environment variables**: Set `CONTENTFUL_PREVIEW_TOKEN`, `CONTENTFUL_PREVIEW_SECRET`, and `CONTENTFUL_HOST`
2. **Dual clients**: Create both delivery and preview clients in your content utility
3. **API routes**: Create `/api/preview` (enable + redirect) and `/api/exit-preview` (disable + redirect)
4. **Draft mode check**: Call `draftMode()` in layouts and pages, pass `isEnabled` to all data fetches
5. **Preview banner**: Conditionally render a banner when `isEnabled` is true
6. **Contentful config**: Add the preview URL in Contentful's Content preview settings
