# Events Listing Page

**Created**: 2026-02-25
**Updated**: 2026-02-25

## Overview

The `/events` page is a **dynamic, code-driven** listing that automatically shows all events from Contentful — no manual curation required. It replaces the old approach of creating an Events page in Contentful and manually adding events to a Collection component.

## Routes

| URL | What renders |
|-----|-------------|
| `/bg/events` | All events listing (Bulgarian) |
| `/en/events` | All events listing (English) |
| `/bg/events/some-event` | Event detail page (unchanged) |
| `/en/events/some-event` | Event detail page (unchanged) |

## File Structure

```
app/[lang]/events/
├── page.tsx              ← Listing page (dynamic)
└── [...slug]/
    └── page.tsx          ← Detail page (existing, per-event)
```

## Site Configuration Fields

Two fields in the **Site Configuration** content type in Contentful control this page:

| Field | Type | Description |
|-------|------|-------------|
| `eventsHero` | Media (image array) | Hero banner image(s) displayed at the top of the events page |
| `eventsPerPage` | Number | How many past events to show per page (default: 10) |

These are fetched via `getSiteConfig()` and passed to the page components.

## How It Works

### Data Flow

```
EventsPage (server component)
    │
    ├── getAllEvents(lang, preview)     ← fetches all events from Contentful
    ├── getSiteConfig(lang, preview)   ← fetches hero image, perPage, fallback images
    │
    └── renders:
        ├── Hero                       ← banner from siteConfig.eventsHero
        │
        └── page__with-sidebar
            ├── EventsConnector        ← client component, display + pagination
            │   ├── Upcoming events    (sorted ascending by date)
            │   ├── Past events        (sorted descending, paginated)
            │   ├── Year filter        (dropdown for past events)
            │   └── Pagination         (for past events)
            │
            └── Sidebar
                ├── EventsCalendar
                ├── DonateWidget
                └── SubscribeForm
```

### Page Layout

```
┌──────────────────────────────────────────┐
│  Navigation                              │
├──────────────────────────────────────────┤
│  Hero Banner (from eventsHero)           │
├──────────────────────┬───────────────────┤
│  Upcoming Events     │  Sidebar          │
│  ┌────────────────┐  │  ┌─────────────┐ │
│  │ Event card     │  │  │ Calendar    │ │
│  │ Event card     │  │  │ Donate      │ │
│  └────────────────┘  │  │ Subscribe   │ │
│                      │  └─────────────┘ │
│  Past Events  [year] │                   │
│  ┌────────────────┐  │                   │
│  │ Event card     │  │                   │
│  │ Event card     │  │                   │
│  └────────────────┘  │                   │
│  « 1 2 3 4 5 ... »   │                   │
├──────────────────────┴───────────────────┤
│  Footer                                  │
└──────────────────────────────────────────┘
```

### Server Component (`page.tsx`)

1. Validates locale, fetches events and site config in parallel
2. Extracts `eventsHero` images and `eventsPerPage` from site config
3. Renders the `Hero` component if `eventsHero` images exist (quarter height, fixed size)
4. Passes `eventsPerPage` to `EventsConnector` for client-side pagination

### EventsConnector Logic

The `EventsConnector` (client component in `components/Events/EventsConnector.tsx`) handles:

1. **Splitting** events into upcoming vs past based on current date
2. **Sorting**: upcoming ascending (soonest first), past descending (most recent first)
3. **Year filter**: dropdown to filter past events by year — resets pagination to page 1
4. **Pagination**: past events are paginated using `eventsPerPage` (default: 10)
   - Uses the existing `Pagination` component (`components/Pagination`)
   - Scrolls to top on page change
   - Only shown when filtered results exceed `eventsPerPage`
5. **Fallback images**: uses site config `fallbackEvents` image when an event has no cover

### Metadata

Uses `buildMetadata()` with the page title pulled from translations (`Events.sectionTitle` → "Събития" / "Events").

### Preview Mode

Passes `draftMode().isEnabled` to both `getAllEvents()` and `getSiteConfig()`, so draft events appear when preview mode is active.

## SiteConfig Type

```typescript
export type SiteConfig = {
  fallbackEvents?: ...;
  fallbackEvent?: ...;
  fallbackNews?: ...;
  listingEvents?: number;
  listingNews?: number;
  eventsHero?: Record<string, unknown>[];   // Hero images for /events page
  eventsPerPage?: number;                    // Pagination size (default: 10)
  [key: string]: unknown;
};
```

## Before vs After

| Aspect | Before (Contentful-driven) | After (code-driven) |
|--------|---------------------------|---------------------|
| Adding events | Add event to Contentful, then manually add to Collection on Events page | Just add event to Contentful — appears automatically |
| Hero banner | Configured per-page in Contentful | Configured once in Site Configuration (`eventsHero`) |
| Ordering | Manual order in Collection | Automatic: upcoming by date asc, past by date desc |
| Pagination | Not available | Built-in with configurable page size (`eventsPerPage`) |
| Year filter | Not available | Built-in dropdown for past events |
| Sidebar | Depended on page config | Always present (Calendar, Donate, Subscribe) |
| Maintenance | Two steps per event | Zero steps — fully dynamic |

## Migration Notes

- The old Contentful Events page can be removed once this page is verified
- If Contentful navigation links point to the old page, update them to link to `/events`
- Next.js gives priority to `app/[lang]/events/page.tsx` over `app/[lang]/[[...slug]]` for the `/events` path, so both can coexist without conflict
