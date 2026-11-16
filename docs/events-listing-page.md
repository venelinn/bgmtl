# Events Listing Page

**Created**: 2026-02-25
**Updated**: 2026-11-16

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

| Field | Type | Description |
|-------|------|-------------|
| `eventsPerPage` | Number | Past events per archive page. Rounded **down to whole rows of 3** (10 → 9), default 9. |
| `fallbackEvents` | Media | Cover used when an event has no image. |
| `eventsHero` | Media (image array) | **No longer used** by `/events` (2026-11 redesign: light header instead of a photo hero). Harmless to keep. |

These are fetched via `getSiteConfig()` and passed to the page components.

## How It Works

### Data Flow

```
EventsPage (server component, app/[lang]/events/page.tsx)
    │
    ├── getAllEvents(lang, preview)
    ├── getSiteConfig(lang, preview)       ← eventsPerPage, fallbackEvents
    │
    └── renders:
        ├── JsonLd                          ← ItemList of events
        ├── EventsPageHeader                ← shared PageHeader on a pale band:
        │                                     breadcrumb, pill, h1, intro, "Предложи събитие"
        ├── EventsBrowser (client)
        │   ├── Toolbar                     ← jump links (#upcoming / #past, with counts),
        │   │                                 search (title + venue, accent-insensitive),
        │   │                                 tag chips (only tags in use)
        │   ├── page__with-sidebar
        │   │   ├── Upcoming list           ← <Event> cards, soonest first
        │   │   └── Sidebar (passed in)     ← EventsCalendar, OrganizeEventWidget, DonateWidget
        │   └── Archive band (full width)   ← year tabs (only if >1 year), <EventArchiveCard> grid,
        │                                     "Показани X от Y", Pagination
        └── Join                            ← newsletter block (same as homepage)
```

Search and tag chips filter **both** the upcoming list and the archive; any filter change
resets the archive to page 1.

### Components

| Component | Role |
|---|---|
| `components/Events/EventsPageHeader.tsx` | Events copy + CTA on the shared `components/PageHeader` |
| `components/Events/EventsBrowser.tsx` | Toolbar, upcoming list, archive band (client state) |
| `components/Events/Event.tsx` | Event card — cover left with tag badges, long date, 3-line excerpt, venue, ticket button (`secondary`, navy) + "Детайли и локация". Shadow, no border; 32px between stacked cards; stacks below 600px (container query). Used on the homepage, `/events` and CMS collections. |
| `components/Events/EventArchiveCard.tsx` | Compact, image-less past-event card |
| `components/Widgets/OrganizeEvent.tsx` | Navy "Организирате събитие в Квебек?" card → `/contacts?topic=event#contact-form` |
| `components/Events/EventsConnector.tsx` | **Only** for CMS `events` sections now (old Upcoming/Past + year select). Not used by `/events`. |

### Event tags

`event.tags` (migration `contentful/migration/2026-11-16-event-tags.js`): up to 2 of
`theatre, music, family, traditions, culture, sport, community, guest, free`
(`EVENT_TAGS` in `types/events.ts`). Labels: `messages/*.json` → `Events.tags.*`.
Unknown values are skipped. Shown as badges on the card cover and as the filter chips here.

### Event detail

- Breadcrumb "Начало / Събития / <title>" (+ BreadcrumbList JSON-LD) above the back link.
- Map: `components/Events/MapEmbed.tsx` loads Google Maps **only after cookie consent**
  (or a click on "Покажи картата") — see `docs/analytics.md`.

### Metadata

Uses `buildMetadata()` with the page title from translations (`Events.sectionTitle`).

### Preview Mode

Passes `draftMode().isEnabled` to both `getAllEvents()` and `getSiteConfig()`.

## Migration Notes

- The old Contentful Events page can be removed once this page is verified
- If Contentful navigation links point to the old page, update them to link to `/events`
- Next.js gives priority to `app/[lang]/events/page.tsx` over `app/[lang]/[[...slug]]` for the `/events` path, so both can coexist without conflict

## Multi-date events

An event that happens on several dates (a tour, a weekly class) is modelled as **one
Contentful event entry per date**. There is no `seriesId` field and no schema change.

- **Grouping:** entries whose **Bulgarian heading** is identical form a series.
- **URLs:** the detail slug comes from the Bulgarian heading. The earliest date keeps the
  plain slug; every later date gets `-YYYY-MM-DD` appended (`/events/bocelli`,
  `/events/bocelli-2026-12-14`). Adding a later date never moves an existing URL; adding a
  date *earlier* than the current first one would move the first date's URL.
- **Implementation:** done once in `getBulgarianEventHeadingsMap` (`utils/content.ts`),
  which sets `bgHeading`. Cards, calendar, JSON-LD, newsletter, sitemap, `generateStaticParams`
  and the detail page all derive the slug from `bgHeading`.
- **Detail page:** shows an **Other dates** row (upcoming siblings only) via the `otherDates`
  prop on `EventDetail`.
- **Calendar:** if several events fall on one day, the earliest represents the day.
- **Adding in Contentful:** copy the event entry, change **Date** / **Doors open**, give it a
  unique ID (`event-<slug>-<YYYY-MM-DD>`), keep the Bulgarian heading text identical, publish.
- **Known gap:** `scripts/build-newsletter.js` still slugs from the title only.
