# Content Flow Specification

> High-level specification for adding content to the bgottawa-gatineau site.  
> Use with NotebookLM, GitHub Spec Kit, or as project documentation.

---

## Table of Contents

1. [Page Model](#1-page-model)
2. [Section Model](#2-section-model)
3. [Section Controls & Section Components](#3-section-controls--section-components)
4. [Collections](#4-collections)
5. [Paragraph Component](#5-paragraph-component)
6. [News & Events](#6-news--events)
7. [Header & Footer](#7-header--footer)

---

## 1. Page Model

**Role:** Top-level content model. Each page = one URL (e.g. `/`, `/about`, `/about/mission`).

**Fields:**

| Field       | Type   | Description                                      |
| ----------- | ------ | ------------------------------------------------ |
| title       | Symbol | Internal label                                   |
| pageName    | Symbol | Display name (localized)                          |
| slug        | Symbol | URL path (e.g. `/`, `about`, `about/mission`)    |
| metaData    | Link   | SEO metadata                                     |
| sections    | Array  | Ordered list of section entries                  |
| sidebar     | Boolean| Whether to show sidebar                          |
| widgets     | Array  | Sidebar widgets (calendar, donate, subscribe)     |
| listings    | Array  | Optional events/news listings (`["events","news"]`) |

**Flow:** `getPageBySlug()` fetches the page by slug. The page's `sections` array defines the vertical order of blocks. Each section is resolved by its Contentful content type and rendered via `componentMap`.

---

## 2. Section Model

**Role:** Wrapper that groups child components and controls layout/styling.

**Fields:**

| Field           | Type     | Description                                      |
| --------------- | -------- | ------------------------------------------------ |
| heading         | Link     | Section title                                    |
| description     | RichText | Optional rich text                               |
| image           | Link     | Optional background/header image                 |
| components/items/content | Array | Child entries (paragraph, collection, slider, etc.) |
| size            | Symbol   | `fixed` \| `full` \| `full-max` \| `breakout` \| `small` |
| padding         | Symbol   | `none` \| `xsmall` \| `small` \| `medium` \| `large` |
| theme           | Symbol   | `light` \| `dark` \| `highlight` \| `transparent` |
| headingVariant  | Symbol   | `horizontal` \| `vertical`                      |

**Flow:** `SectionConnector` maps CMS data to the `Section` UI component. It renders its children (components/items/content) by looking up each child's type in `componentMap` and rendering the matching component.

---

## 3. Section Controls & Section Components

### Section Controls

Layout and styling options: size, padding, theme, heading variant, image alignment, etc.

### Section Components

Child entries inside a section. Each child has a `type` (content type ID) that maps to a React component:

| Content Type   | Component            | Purpose                              |
| -------------- | -------------------- | ------------------------------------ |
| hero           | HeroConnector        | Hero banner (title, image, CTA)      |
| section        | SectionConnector     | Nested section with its own children |
| collection     | CollectionConnector  | Grid/list of cards                   |
| paragraph      | ParagraphConnector   | Heading + rich text                  |
| imageContent   | ImageContentConnector| Image block                          |
| contacts       | ContactsConnector    | Contact info                         |
| events         | EventsConnector      | Events listing                       |
| table          | TableConnector       | Table                                |

**Flow:** The page iterates over `page.sections`. For each section with `type === "section"`, it reads `components` / `items` / `content`, maps each child's `type` to `componentMap[child.type]`, and renders that component with the child's props.

---

## 4. Collections

**Role:** Reusable block for displaying a set of cards in different layouts.

**Fields:**

| Field          | Type   | Description                                      |
| -------------- | ------ | ------------------------------------------------ |
| heading        | Link   | Optional section heading                         |
| description    | RichText | Optional rich text                             |
| cards          | Array  | Links to card, member, event, or news entries   |
| variant        | Symbol | `grid` \| `paginated` \| `slider`                |
| cardVariant    | Symbol | Card style (primary, event, news, info, member)  |
| itemsPerRow    | Integer| 1–4                                               |
| itemsPerPage   | Integer| For paginated variant                            |
| cardsWidth     | Symbol | `default` \| `breakout` \| `full-width`         |

**Flow:** `CollectionConnector` receives the collection entry, transforms cards via `collectionTransformer`, and renders as Grid, Paginated, or Slider. Card types include events, news, members, info cards, and primary cards.

---

## 5. Paragraph Component

**Role:** Simple block for heading + body text.

**Fields:**

| Field       | Type     | Description                    |
| ----------- | -------- | ------------------------------ |
| heading     | Link     | Optional heading (as, size)    |
| description | Symbol   | Optional plain text            |
| content     | RichText | Rich text (bold, links, etc.)  |
| alignment   | Boolean  | Center heading                 |

**Flow:** `ParagraphConnector` renders the heading (if present), description, and rich text content via `renderRichTextContent()`.

---

## 6. News & Events

News and Events are standalone content types with their own detail pages and slug logic. They can appear in Collections and Listings.

### 6.1 Slug Logic (Events & News)

**Shared behavior:**

- Slugs are derived from the **Bulgarian heading** (`bgHeading`) for consistent URLs across locales.
- `slugify()` transliterates Cyrillic to Latin, lowercases, and replaces spaces with hyphens.
- **Events:** `getEventPermalink({ locale, title })` → `/{locale}/events/{slug}` (or `/events/{slug}` for Bulgarian).
- **News:** `getNewsPermalink({ locale, title })` → `/{locale}/news/{slug}` (or `/news/{slug}` for Bulgarian).

**Detail page lookup:**

- **Events:** `app/[lang]/events/[...slug]/page.tsx` – finds event by matching `slugify(bgHeading || heading)` to the URL slug.
- **News:** `app/[lang]/news/[...slug]/page.tsx` – same pattern for news.

**Static params:** Both use `getAllEventsBulgarian()` / `getAllNewsBulgarian()` to pre-generate paths for all locales.

### 6.2 Events – Past / Upcoming

Events are split by date:

- **Upcoming:** `new Date(event.date) > today` – sorted ascending (soonest first).
- **Past:** `new Date(event.date) <= today` – sorted descending (most recent first).

**Display:**

- **EventsPaginatedWithHeadings** and **EventsGridWithHeadings** render two blocks:
  1. "Upcoming Events" – upcoming events.
  2. "Past Events" – past events (or "No events available" if none).

### 6.3 Events – Buy Button & Doors Open (Upcoming Only)

On the **EventDetail** page, these show **only for upcoming events** (`!pastEvent`):

- **Buy Ticket:** Shown when `event.ticket` exists and has a `url`. Links to external ticket URL.
- **Doors open at:** Shown when `event.doorsOpen` exists. Renders time with `FormattedTime`.

Past events do not show the buy button or doors-open time.

### 6.4 News

- No past/upcoming split – all news listed by date (newest first).
- No buy button or doors-open field.
- Same slug logic as events (Bulgarian heading → `slugify` → `/news/{slug}`).

### 6.5 Where Events & News Appear

- **Collections:** As cards via `cardVariant="event"` or `cardVariant="news"`; cards link to detail pages using `getEventPermalink` / `getNewsPermalink`.
- **Listings:** Page `listings` field can include `["events"]`, `["news"]`, or both; each type renders in its own section with a "View all" link to `/events` or `/news`.

---

## 7. Header & Footer

**Role:** Global navigation and footer. Managed via `header` and `footer` content types. Fetched by `getHeader()` and `getFooter()`.

### Header Fields

| Field       | Type          | Description                          |
| ----------- | ------------- | ------------------------------------ |
| title       | Symbol        | Internal label                       |
| logo        | JSON/Asset    | Main logo image                      |
| mobileLogo  | JSON/Asset    | Logo for mobile                      |
| logoLink    | Reference     | Where logo links (Page or Link)      |
| menuLinks   | References    | Menu items (Link, Header Menu, Page) |

### Footer Fields

| Field       | Type          | Description                          |
| ----------- | ------------- | ------------------------------------ |
| title       | Symbol        | Internal label                       |
| copyright   | Symbol        | Copyright text (localized)            |
| fineprint   | Symbol        | Fine print (localized)                |
| menuLinks   | References    | Menu items (same as header)           |

### Menu Items – Supported Entry Types

Menu items (Header and Footer) accept only:

- **Link** – External URL or custom link (name, url, target)
- **Header Menu** – Dropdown/group with `displayTitle` (localized) and nested `menuItems`
- **Page** – Internal page (slug, parent, pageName)

**Flow:** `extractMenuColumns(menuLinks, locale, "header"|"footer")` processes menu data. Header mode: single-link items as plain links, multi-link items as titled groups. Footer mode: flattens into columns with title + links. `contentfulItemToLink()` converts Link and Page entries to `LinkItem` shape.

---

## End-to-End Flow

```
1. Page          → Loaded by slug; defines sections + optional sidebar/listings
2. Sections      → Each section is a Contentful entry; type selects component
3. Section (CT)  → Wrapper with layout controls; components/items/content = child entries
4. Section components → Each child's type maps to component (hero, collection, paragraph, etc.)
5. Collection    → Renders cards in grid/paginated/slider layouts
6. Paragraph     → Renders heading + rich text
7. Events/News   → Standalone content types with slug-based detail pages; special logic for past/upcoming, buy button, doors open
8. Header/Footer → Global navigation; menu items = Link, Header Menu, or Page
```

---

## GitHub Spec Kit Usage

Use this document with Spec Kit commands:

```bash
# Establish principles
/speckit.constitution Use this content flow spec for consistency when adding new content types or sections

# Specify a feature
/speckit.specify Add a new content block following the Page → Section → Component flow described in docs/CONTENT-FLOW-SPEC.md. Events and News use Bulgarian heading for slugs and have special display logic for past/upcoming.
```
