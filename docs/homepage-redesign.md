# Site redesign (Stitch mocks)

> Started as the homepage redesign; now also tracks /events, /contacts, /privacy, the footer,
> breadcrumbs and the header controls. Updated 2026-11-16.

Source: Stitch project `8109149400298636551`, screen `33afbc767bfe4e4aa78b0dc4c9f4d96c`
("Българска Общност в Монреал - Начало & Указател"), plus screens `79466401d62f456e89e22b9f12c94eab`
(Събития) and `872501a644ad462aa79783a7e8fa319e` (Контакти). The top nav layout is out of scope
(transparent over a photo hero, solid otherwise) — only its controls were restyled (see below).

## Do not carry over from the mock

- Plus Jakarta Sans headings — no Cyrillic glyphs (the mock rendered a system fallback).
- Fabricated content: stats (1,400+ / 85+ / 12+), category counts, extra directory
  listings, side news items, newcomer-guide copy, "© 2024".
- Claims: "Официален портал на диаспората • Montréal, QC" eyebrow (dropped), "Проверени
  специалисти / Проверен бизнес указател", "Популярен" badges, "Stripe & PayPal".
- Second newsletter form in the footer (Join already covers it).

## Sections

| # | Section | Change | Status |
|---|---|---|---|
| 1 | Hero | Subtitle, site-wide search with autocomplete + quick category chips, 2 CTAs, ~75vh. Stats band only with real numbers. | done (live 2026-11-16; autocomplete PR #20) |
| 2 | Events + sidebar | Image-left event card (shared everywhere; see `docs/events-listing-page.md`), `tags` badges, calendar "На фокус" card, Monday-first calendar. | done (PR #19) |
| 3 | Directory | Pale-blue band (`--primary-container-low`), eyebrow/title/intro + "Добави профил" (→ /contacts), category tabs with real counts filtering the 6 newest in place, new DirectoryCard (logo or initial square, `note` as red subtitle, website row, one CTA: website → call → email) used on /community too, "add your business" banner (→ /contacts). Copy in `messages` (Directory.home*). Section moved above News; Join now last. | done (PR #19) |
| 4 | Newcomer guide (new) | 3 step cards — needs real content (CMS). | phase 2 |
| 5 | News | Featured + 2 side items; graceful with 1 item. News card still uses the `listing-card` mixin. | todo |
| 6 | Join | Kept (embroidery image). Added "Без спам…" fine print; smooth-scroll target of the hero "Присъедини се" button. Last section on the homepage and /events. | done |
| 7 | Footer | Kept navy. Brand column (header logo, `footer.description` from Contentful — migration `2026-11-16-footer-description.js`, social icons moved here), the Contentful link columns, newsletter widget (useSubscribe → /api/subscribe; copy in `messages` Footer.*), fine-print row unchanged. | done (PR #19) |

Global: mock palette is navy `#00152a`, red `#de2e2c`, green accents, pale-blue section
surfaces `#eef4ff`. Fold into `tokens/` rather than hardcoding.

## Phasing

1. Code-only restyle: section order, event cards, directory chips + 6 cards, news layout.
2. Hero + search.
3. Footer + tokens.
4. Content-dependent: event categories, newcomer guide, per-listing CTA, real stats.

## Hero — extended variant (done in code)

Migration `contentful/migration/2026-11-16-hero-extended-search.js` (applied to `master`)
adds to `hero`: `extended`, `searchPlaceholder`, `searchButtonLabel`, `quickLinksLabel`
(localized), `quickCategories` (→ `communityCategory`, max 6), `buttons` (→ `link`, max 2),
and `two-thirds` to `height`. No new content type (space is at 24/25).

- `extended` on → `HeroSearch` (smoked-glass panel) under the body; hero grows with content and clears the nav. Off → hero unchanged
  (event/news detail heroes never set it).
- Search is a GET form to `{localePrefix}/community?q=…`; the directory hydrates `?q=`.
  Enter without picking a suggestion still lands there (no separate results page).
- **Autocomplete (site-wide):** `HeroConnector` builds a lean index server-side
  (`HeroSearchSuggestion`: kind, label, match text, href) from the directory, events and
  news (`getAllEvents` / `getAllNews`; a failed fetch just drops that group) and passes it
  to `HeroSearch`, which filters client-side (accent-insensitive `fold`, ARIA combobox).
  Groups and caps: Categories 3 · Listings 4 · Events 3 (upcoming soonest first, then past
  newest first) · News 3. Hrefs: category → `/community/<slug>`, listing (no own page) →
  `/community?q=<name>`, event/news → permalink from the Bulgarian heading.
- Focusing the empty box lists up to 10 categories, **most listings first** (ties keep the
  CMS `order`) — "most used" = listing count, there's no click tracking. Same order while typing.
- Dropdown: same smoked glass as the panel (darker tint, `blur(40px)`), two columns from `md`
  (groups pair up row by row), custom white clear button (native one hidden). Copy:
  `Hero.suggest.*`, `Hero.clear`; default placeholder "Търсете обекти, събития, новини…".
- Glass gotchas: an element with `backdrop-filter` (or any `filter`/`opacity < 1`) is a
  *backdrop root* — a nested blur only sees inside it. So the panel's glass lives on
  `&__panel::before`, and the hero entrance animation on the search uses fill-mode
  `backwards` (not `both`) so it doesn't keep `filter: blur(0)` after finishing.
  The panel is `position: relative; z-index: 1` so the dropdown paints over the CTAs
  (Buttons are `position: relative` and come later in the DOM).
- Hero content entrance (`animateContent`): title 0s, body 0.15s, extra content (search) 0.3s.
- Empty labels fall back to the `Hero` namespace in `messages/*.json`. No quick
  categories picked → first 5 non-empty categories by `order`.
- `HeroConnector` is server-only and is NOT re-exported from `components/Hero/index.ts`
  (a client graph imports that index; re-exporting bundled the connector for the browser
  and crashed the render). Import it from `components/Hero/HeroConnector`.
- Chips (picked or fallback) are filtered to categories with ≥1 Montreal listing —
  `/community/<slug>` 404s for empty categories.

- Link entries in `buttons`: `primary` and `secondary` both render as the dropdown's smoked
  glass (red icons), going darker on hover; other variants keep the normal Button look.
- `toButtons` drops mapEntry's `type` (content type id "link") so `parseLinkAppearance`
  reads the variant — otherwise every button falls back to `primary`.

Homepage entry setup (saved as **draft** 2026-11-16 — publish with the code deploy): tick `extended`, set `height: two-thirds`, put the subtitle in
`content` (drop the embedded "Присъединете се" link — Join has its own section), pick
quick categories, add two Link entries as `buttons` (Разгледай указателя → `/community`,
Календар със събития → `/events`).

## Events page (/events) — Stitch screen `79466401d62f456e89e22b9f12c94eab`

Final header: **light `PageHeader` band, no photo** (`siteConfig.eventsHero` unused). Tried and
dropped: photo hero with the header on it, photo beside the text. The "Предстоящи/Отминали"
toggle became plain jump links (it read as a filter with nothing selected).

- Event card (shared: homepage, /events, CMS collections): cover flush left with tag badges,
  long date + time, title, 3-line excerpt, venue, ticket button (`secondary`, navy — was briefly
  red `danger`, reverted) + "Детайли и локация".
  Own styles (no longer the `listing-card` mixin; news still uses it). Stacks under 600px
  (container query on the card).
- /events: light header (`EventsPageHeader` on the shared `PageHeader` — breadcrumb, pill, h1,
  intro, "Предложи събитие" → /contacts?topic=event), so the nav is solid; `EventsBrowser` — jump links with counts, accent-insensitive
  search (title + venue), tag chips (only used tags), upcoming list + sidebar (calendar,
  `OrganizeEventWidget`, donate), past archive band (year tabs when >1 year, compact
  `EventArchiveCard` grid, page size rounded to rows of 3, pagination), then `Join`.
- `siteConfig.eventsHero` is no longer used on /events. CMS "events" sections still use
  `EventsConnector` (unchanged).
- Calendar weeks start on Monday.
- Not built: "Календарен изглед" tab, mock-only badges ("Препоръчано", "30 години Романца"),
  "Виж архив / снимки" (no event has a gallery).

## Community page (/community)

- Same header as /contacts: `DirectoryConnector` renders a `PageHeader` (breadcrumb incl. the
  category on `/community/<slug>`, pill `Directory.homeEyebrow`, h1 = section `heading`, intro =
  section `intro`) when the page hands it `crumbs`; the page then skips its own breadcrumb row.
  Without a heading it falls back to the directory's small header.
- `FilterableDirectory` gets `directory--headless` (top padding `--spacing-6` instead of
  `--spacing-10`) when it has no own header, so the search sits close under the band.
- No title accent yet (the heading is one CMS string).

## Contacts page (/contacts) — Stitch screen `872501a644ad462aa79783a7e8fa319e`

- Contentful: page sections = the `contacts` block only (photo hero + wrapper section unlinked,
  entries kept). `page.sections` now allows `contacts` (migration `2026-11-16-allow-contacts-in-page-sections.js`).
- `ContactsConnector` (server) → `Contacts` (client): `PageHeader` ("Свържете се *с нас*"), form card
  (name, email, optional phone, subject select, 1000-char counter, required privacy consent;
  consent left / submit right), sidebar (footer social links as "Общностни канали", Donate),
  navy banner (directory / event CTAs).
- `?topic=general|event|directory|partnership|other` preselects the subject; all "add" CTAs on the
  site link here with a topic + `#contact-form`.
- Netlify Forms: `public/__forms.html` must list every field (now phone, topic, consent).
- Not built: FAQ, fabricated "6,500+" stat, "24–48h" promise, "Монреал (EST)".

## Privacy

- `/privacy` Contentful page (heading, metaData, section, one paragraph with BG/EN/FR rich text).
  Paragraph rich text allows H2/H3 (migration `2026-11-16-paragraph-headings.js`).
- Maps gated on cookie consent — see `docs/analytics.md`, `docs/gdpr-readiness.md` (open items there).

## Shared pieces added

- `components/PageHeader` — pale band header (breadcrumb, pill, title + accent, intro, actions).
- `components/Breadcrumbs` — trail + BreadcrumbList JSON-LD; automatic on CMS pages
  (`docs/cms-page-rendering.md` §5b), plus event/news detail.
- `Hero` grows with its content and clears the nav whenever it gets `children` (not only `extended`).
- Token `--primary-container-low` (`#eef4ff`, dark: muted navy) for pale bands/cards.
- CSS-only smooth anchor scrolling (`styles/globals.scss`, respects reduced motion).

## Help page (`/help`, "Помощ и полезна информация")

- Started from the Stitch "Наръчник за новодошли" section, widened to a general help page (`page-help`, full width).
- One section + `collection-help-guide` (grid, `cardVariant: guide`, 3 per row) of 29 cards → `components/Cards/GuideCard`:
  icon, category eyebrow (`card.role`), title, short text, source host + external link to the official page.
- `components/Guide/GuideList`: "check the official sites" `Alert` (messages `Guide.notice*`) + category filter chips
  built from `card.role` (6 categories: Документи, Здраве, Семейство и образование, Език и работа, Жилище и транспорт,
  За българите — new cards should reuse one).
- Homepage teaser `HomeGuideConnector`: first 3 cards of that collection (reorder in Contentful), no filters.
- CMS pages whose first section has an h1 heading now render it as a `PageHeader` band (help, mission, privacy, policies, sponsors, history).
- Content created by `contentful/add-help-guide.cjs` (fixed entry ids, re-runnable; dry run without `--publish`).
- Not linked from the nav yet.

## Header controls

- Language switcher: smoked-glass pill (like the hero search panel) + dark rounded menu card.
- Theme toggle: matching smoked-glass circle (desktop; mobile keeps the labelled row).
- Page `iconName` (migration `2026-11-16-page-menu-icon.js`) → icon before the menu link;
  "Събития" uses `CalendarDays`. Menu now renders icons (it used to print the name as text).

## Migrations (all applied to `master`)

| File | Change |
|---|---|
| `2026-11-16-hero-extended-search.js` | hero: extended, search texts, quickCategories, buttons, `two-thirds` height |
| `2026-11-16-event-tags.js` | event: tags |
| `2026-11-16-footer-description.js` | footer: description |
| `2026-11-16-paragraph-headings.js` | paragraph rich text: H2/H3 |
| `2026-11-16-allow-contacts-in-page-sections.js` | page.sections: + contacts |
| `2026-11-16-page-menu-icon.js` | page: iconName |
| `2026-11-17-collection-guide-variant.js` | collection.cardVariant: + guide |
| `2026-11-17-heading-accent.js` | heading: accent (red italic tail in page headers) |

Content-type quota: 24/25 — every change above is a field, not a new type.
