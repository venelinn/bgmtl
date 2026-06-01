# Content Flow Specification

> Product specification for the bgottawa-gatineau content architecture.  
> Compatible with GitHub Spec Kit `/speckit.specify` and `/speckit.plan`.

---

## Goals

- Content editors can add and arrange page content through Contentful without code changes
- Pages are composed of reusable sections (hero, collection, paragraph, etc.)
- Events and News have consistent URLs across locales and clear display rules (past/upcoming, buy button, doors open)
- All content flows from Page → Sections → Components in a predictable hierarchy

## Non-Goals

- Specifying the tech stack (Next.js, Contentful, React) — that belongs in the implementation plan
- Defining visual design or CSS — only structure and behavior

---

## Primary Personas

- **Content Editor:** Adds pages, sections, events, news; expects WYSIWYG-like control over order and layout
- **Developer:** Extends the content model or adds new component types; needs clear mapping from CMS to UI

---

## User Journeys

### Journey 1: Add a New Page

1. Editor creates a Page in Contentful with title, slug, and meta data
2. Editor adds sections in desired order (hero, section, collection, paragraph, etc.)
3. Each section can contain child components (e.g. a section with a collection and a paragraph)
4. Page is published; site renders at `/{locale}/{slug}`

### Journey 2: Add Events or News

1. Editor creates an Event or News entry in Contentful
2. Slug is derived from the Bulgarian heading for consistent URLs across locales
3. Events appear in Upcoming or Past based on date
4. Upcoming events show Buy Ticket (if ticket URL exists) and Doors open (if set)
5. Past events do not show Buy Ticket or Doors open

### Journey 3: Add a Collection to a Page

1. Editor creates a Collection with cards (events, news, members, info cards)
2. Editor chooses variant: grid, paginated, or slider
3. Editor sets items per row, card style, and optional heading
4. Collection renders within a Section on the page

---

## Content Model Hierarchy

```
Header / Footer (global)
├── Logo, Logo Link
└── Menu Links[]
    ├── Link (external URL)
    ├── Page (internal page)
    └── Header Menu (dropdown)
        └── Menu Items[] (Link, Page, or nested Header Menu)

Page
├── sections[] (ordered)
│   ├── hero
│   ├── section (wrapper)
│   │   ├── components[] / items[] / content[]
│   │   │   ├── paragraph
│   │   │   ├── collection
│   │   │   ├── slider
│   │   │   └── ...
│   ├── collection
│   ├── paragraph
│   ├── events
│   └── ...
├── listings[] (optional: ["events"], ["news"], or both)
└── widgets[] (sidebar: calendar, donate, subscribe)
```

---

## Acceptance Criteria

### Page Model

- [ ] Page has required fields: title, pageName, slug
- [ ] Page sections are an ordered array of linked entries
- [ ] Page can optionally show sidebar with widgets and/or listings
- [ ] Page is fetched by slug; fallback to leaf slug for nested paths

### Section Model

- [ ] Section can contain components, items, or content (any of these keys)
- [ ] Section supports layout controls: size, padding, theme, heading variant
- [ ] Section can have optional heading, description, and image
- [ ] Section renders its children by mapping content type to component

### Section Components

- [ ] Each component type (hero, section, collection, paragraph, etc.) maps to a single React component
- [ ] Nested sections are supported (section containing section containing collection)
- [ ] Unknown component types are gracefully skipped

### Collections

- [ ] Collection displays cards in grid, paginated, or slider layout
- [ ] Collection supports card variants: primary, event, news, info, member
- [ ] Collection can link to card, member, event, or news entries
- [ ] Events in collections are split into Upcoming and Past when using grid/paginated

### Paragraph Component

- [ ] Paragraph renders optional heading, optional description, and rich text content
- [ ] Rich text supports bold, links, and embedded content

### Events

- [ ] Event slug is derived from Bulgarian heading via `slugify()`
- [ ] Event detail page is at `/{locale}/events/{slug}` (or `/events/{slug}` for bg)
- [ ] Events are split into Upcoming (date > today) and Past (date <= today)
- [ ] Buy Ticket button shows only for upcoming events when ticket URL exists
- [ ] Doors open shows only for upcoming events when doorsOpen field exists
- [ ] Past events can show Gallery button if gallery URL exists

### Header & Footer

- [ ] Header has Logo, Logo Link, and Menu Links
- [ ] Footer has Menu Links and copyright/fineprint
- [ ] Menu items accept only: Link, Header Menu, Page
- [ ] Header Menu items have Display Title (localized) and nested Menu Items
- [ ] Link type: external URL or custom URL with name and target
- [ ] Page type: links to internal page by slug

### News

- [ ] News slug is derived from Bulgarian heading via `slugify()`
- [ ] News detail page is at `/{locale}/news/{slug}` (or `/news/{slug}` for bg)
- [ ] News has no past/upcoming split; no buy button or doors open
- [ ] News can appear in Collections and Listings

---

## Review & Acceptance Checklist

- [ ] New page can be added and published without code changes
- [ ] Section with nested components renders correctly
- [ ] Collection with events shows Upcoming and Past sections
- [ ] Event detail shows Buy Ticket and Doors open only for upcoming events
- [ ] News and Event slugs are consistent across en/bg locales
- [ ] Listings show separate Events and News sections with "View all" links

---

## Error States and Edge Cases

- **Missing slug:** Page not found; 404
- **Empty sections:** Page renders with empty content area
- **Empty collection:** Collection block does not render (or shows empty state)
- **Event/News not found by slug:** 404 on detail page
- **No upcoming events:** "Past Events" section shows "No events available"
- **No past events:** "Past Events" section shows "No events available"

---

## Empty-State UX

- **Empty page:** Show "Empty page! Add sections." in development only
- **No events:** "No events available" message in Past Events section
- **No news:** News section does not render when empty
- **Empty collection:** Collection block does not render

---

## Related Documentation

- Full technical reference: [docs/CONTENT-FLOW-SPEC.md](../docs/CONTENT-FLOW-SPEC.md)
- Component map: `components/index.tsx`
- Content utilities: `utils/content.ts`
- Slug helpers: `utils/common.ts` (`getEventPermalink`, `getNewsPermalink`, `slugify`)
