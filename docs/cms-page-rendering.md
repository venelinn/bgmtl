# CMS Page Rendering

**File**: `app/[lang]/[[...slug]]/page.tsx`
**Created**: 2026-02-25
**Updated**: 2026-02-25

## Overview

This is the catch-all page route that renders all CMS-driven pages from Contentful. It handles the homepage (`/bg`, `/en`) and any nested page (`/bg/about`, `/en/events`, `/bg/about/mission`, etc.).

## Route Structure

```
app/[lang]/[[...slug]]/page.tsx
         │        │
         │        └── Optional catch-all: [] = homepage, ["about"] = /about, ["about","mission"] = /about/mission
         └── Required locale: "bg" or "en"
```

## Data Flow

```
URL → params → slug → getPageBySlug() → Contentful page entry → mapEntry() → page object
                                                                                    │
                                              ┌────────────────────────────────────────┘
                                              ▼
                                        { sections, sidebar, widgets, listings }
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                         Hero (full-width)  Sections        Sidebar
                                              │               │
                                         componentMap    widgets (calendar,
                                              │          donate, subscribe)
                                              ▼
                                    Rendered components
```

## How It Works

### 1. Metadata (`generateMetadata`)

Fetches the page and extracts the linked `metaData` Contentful entry to build `<title>`, `<meta description>`, `<meta keywords>`, and Open Graph tags via `buildMetadata()`.

### 2. Page Fetch

```
params.slug = ["about", "mission"]  →  path = "about/mission"
params.slug = []                    →  path = "/"  (homepage)
```

- Validates the locale against `localization.locales`
- Calls `getPageBySlug(path, contentfulLocale, preview)` to fetch from Contentful
- Returns `notFound()` if page doesn't exist or locale is invalid

### 3. Page Structure from Contentful

Each Contentful page entry resolves to:

| Field | Type | Description |
|-------|------|-------------|
| `sections` | `Section[]` | Ordered list of content sections (hero, section, events, etc.) |
| `sidebar` | `boolean` | Whether to show the sidebar layout |
| `widgets` | `WidgetType[]` | Sidebar widgets: `"calendar"`, `"donate"`, `"subscribe"` |
| `listings` | `string[]` | Content listings to show: `"events"`, `"news"` |

### 4. Hero Detection

The page checks if the **first section** is a hero:

- Direct: `firstSection.type === "hero"`
- Nested: first section is a `"section"` wrapper whose first child is `"hero"`

If a hero is found, it renders **outside** the sidebar layout (full-width), and the remaining sections render below it.

### 5. Section Rendering

Each section is rendered via `componentMap`:

| Contentful Type | Component |
|----------------|-----------|
| `hero` | `HeroConnector` |
| `section` | `SectionConnector` (wrapper with children) |
| `imageContent` | `ImageContentConnector` |
| `contacts` | `ContactsConnector` |
| `collection` | `CollectionConnector` |
| `paragraph` | `ParagraphConnector` |
| `events` | `EventsConnector` |
| `table` | `TableConnector` |

**Section wrappers** (`type === "section"`) contain nested children in one of three arrays: `components`, `items`, or `content`. Each child is resolved from `componentMap` and rendered inside `<SectionConnector>`.

**Slider detection**: If a section's first child is a `slider`, extra section props are computed via `getSliderSectionProps()`.

### 6. Sidebar Layout

When `sidebar === true` or `listings` is non-empty:

```
┌──────────────────────────────────────────┐
│  Hero (full width, outside sidebar)      │
├──────────────────────┬───────────────────┤
│  Main content        │  Sidebar          │
│  - Listings          │  - Calendar       │
│  - Sections          │  - Donate         │
│                      │  - Subscribe      │
└──────────────────────┴───────────────────┘
```

Without sidebar, sections render full-width.

### 7. Static Generation & ISR

The page uses **Incremental Static Regeneration (ISR)** for optimal performance:

```typescript
export const revalidate = 60; // seconds

export async function generateStaticParams() {
  // Pre-renders all CMS pages for every locale at build time
}
```

#### How it works

| Phase | What happens |
|-------|-------------|
| **Build time** | `generateStaticParams` fetches all page slugs from Contentful via `getPagePaths()` for each locale. Every page is pre-rendered as static HTML. The homepage (no slug) is included explicitly. |
| **First request** | Serves the pre-rendered static HTML — no server work required. |
| **After 60s** | Next request triggers a background revalidation. The stale page is served immediately while Next.js regenerates a fresh version. |
| **New pages** | Pages not in `generateStaticParams` are rendered on-demand at first request, then cached. |
| **Preview mode** | When `draftMode()` is active, bypasses the cache entirely and renders dynamically from Contentful's Preview API. |

#### All page routes with ISR

| Route | `generateStaticParams` | `revalidate` |
|-------|----------------------|-------------|
| `[lang]/[[...slug]]` | Yes — all CMS pages from `getPagePaths()` | 60s |
| `[lang]/events` | No (fixed route, only `[lang]` varies) | 60s |
| `[lang]/events/[...slug]` | Yes — all event detail pages | 60s |
| `[lang]/news/[...slug]` | Yes — all news detail pages | 60s |

### 8. Preview Mode

When `draftMode()` is enabled, `getPageBySlug` fetches from Contentful's Preview API (draft content). The layout shows a yellow preview banner (handled in `[lang]/layout.tsx`). Preview mode bypasses ISR caching — pages are always rendered fresh with draft content.

### 9. Empty State

In development only (`IS_DEV`), pages with no sections and no hero show a dashed-border placeholder: "Empty page! Add sections."

## Key Dependencies

| Import | Purpose |
|--------|---------|
| `componentMap` | Maps Contentful content types → React components |
| `getPageBySlug` | Fetches + resolves a Contentful page by slug |
| `getPagePaths` | Fetches all page slugs for static generation |
| `buildMetadata` | Constructs Next.js Metadata from Contentful `metaData` entry |
| `SectionConnector` | Wraps section children with layout/styling props |
| `ListingsConnector` | Renders event/news listing cards |
| `Sidebar` | Sidebar wrapper component |
| `getSliderSectionProps` | Computes section props when child is a slider |
