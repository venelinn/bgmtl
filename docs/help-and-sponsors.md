# Help page (`/help`) and Sponsors page (`/sponsors`)

Two CMS pages built from regular Contentful entries (page → section → collection → card).
Each is set up by a re-runnable content script with fixed entry ids. Neither needs a new content type.

## Help — "Помощ и полезна информация"

Practical information for life in Montréal and Québec. Each card summarizes one topic in a few
sentences and links to the official source. Started from the Stitch "Наръчник за новодошли"
section, then widened to a general help page.

### Structure

```
page-help (slug "help", sidebar off, pageName → heading-help-page "Помощ")
└── section-help-guide
    ├── heading-help-section  h1  "Помощ и" + accent "полезна информация"  → PageHeader band
    ├── description           intro paragraph                             → PageHeader intro
    └── collection-help-guide  grid · cardVariant "guide" · 3 per row
        └── card-help-<key> × 30
            heading (title) · role (category) · content (text) · icon · link (official page)
```

### Rendering

- `GuideCard` (`components/Cards/GuideCard`): icon in a tinted square, category label, title, text,
  and a footer with the source host (e.g. `quebec.ca`) and the link. The link opens in a new tab.
- `GuideList` (`components/Guide`) wraps the grid when `cardVariant` is `guide`:
  - an `Alert` reading "Проверявайте официалните сайтове" (messages `Guide.noticeTitle` / `Guide.notice`);
  - category filter chips, one per distinct `card.role`, plus "Всички".
- **Category colours.** Each category gets `--category-1..6` in order of first appearance in the
  collection. The order is the same in every locale. The colour drives the card's top stripe, icon
  box and label, and the chip's dot and pressed fill. Light values are in `tokens/semantic.json`;
  dark values are in `styles/_theme-dark.scss`.
- **Homepage teaser.** `HomeGuideConnector` renders the first 3 cards of the collection with
  `filters={false}`, so no chips and no Alert. To choose which cards appear, reorder them in Contentful.
  Its texts are in messages `Guide.home*`.

### Categories (`card.role`)

Документи · Здраве · Семейство и образование · Език и работа · Жилище и транспорт · За българите.
New cards should reuse one of these. A new category gets the next colour; there are 6 colours, and
they repeat after that.

### Editing

- Text, links and order: edit in Contentful, or in `contentful/add-help-guide.cjs` and re-run it
  (`--publish`). Without the flag it is a dry run that prints every text.
- Some cards quote figures that go out of date: minimum wage, citizenship days, QPIP earnings,
  the Hydro-Québec phone fee, pharmacist powers from Dec 2026. Check them about once a year.
- Every link was checked when added. canada.ca, cik.bg and rvsq.gouv.qc.ca block automated
  checks, so open those in a browser.

## Sponsors — "Станете спонсор"

### Structure

```
page 1n5l73CdqcB8FPFLtRvxdt (slug "sponsors", sidebar off, pageName → pagename-sponsors "Спонсори")
├── section-sponsors-why
│   ├── heading-sponsors-page   h1 "Станете" + accent "спонсор"   → PageHeader band
│   ├── description             intro                             → PageHeader intro
│   └── collection-sponsors-why   cardVariant "info" · 3 cards, variant "featured"
└── section-sponsors-tiers
    ├── heading "Спонсорски пакети" + note "Сумите са годишни…"
    └── collection-sponsors-tiers cardVariant "tier" · 3 cards
        role = price ("500 $ / година") · content = benefit list · link = link-sponsors-contact
```

### Rendering

- **Why cards.** These are `InfoCard`s with `card.variant = "featured"`. Featured info cards take
  the Bulgarian flag colours in order (white, green, red; tokens `--flag-green` / `--flag-red`),
  with the icon in a round badge on the left. Any other info collection can use this by marking
  its cards as featured.
- **Tiers.** `TierCard` (`components/Cards/TierCard`): icon, name and price in a row, a benefit
  list with check marks, and a full-width button. The card with `variant = "featured"` gets the red
  border, the "Препоръчан" badge (messages `Cards.featured`) and a filled button.
- Every button opens `/contacts?topic=partnership#contact-form`, which is the contact form with
  the Partnership topic preselected.

### Tiers (yearly)

| Tier | Price | Benefits |
|---|---|---|
| Приятел | 250 $ | Name + logo on /sponsors · thanks in the newsletter |
| Партньор (featured) | 500 $ | + logo on event posters/banners · Facebook post |
| Главен спонсор | 1 000 $ | + top spot on /sponsors · thanks from the stage · newsletter + Facebook feature |

The prices follow comparable community groups in Canada, which charge $250 / $500 / $1,000 a year.
Change them in Contentful (cards "Sponsors tier: …") or in `contentful/add-sponsors-page.cjs`.

There is no "Our sponsors" logo section yet. Add one once there are sponsors.

## Shared: page header from the first h1 section

On CMS pages, a first `section` whose heading is `as: h1` becomes a `PageHeader` band with the
breadcrumb, title and intro, like Contacts. The heading's optional **accent** is rendered after
the title in red italics. See `docs/cms-page-rendering.md` §5c.

**Keep `pageName` separate.** The nav menu, footer and breadcrumb use `page.pageName`. If it points
at the same heading entry as the h1 section, the accent split cuts the label to its first half
("Нашата"). `contentful/fix-page-names.cjs` gives each page its own `pagename-<slug>` heading.

## Scripts and migrations

| File | What it does |
|---|---|
| `contentful/migration/2026-11-17-collection-guide-variant.js` | `collection.cardVariant` + `guide` |
| `contentful/migration/2026-11-17-heading-accent.js` | `heading.accent` (localized Symbol) |
| `contentful/migration/2026-11-17-sponsor-tiers.js` | `collection.cardVariant` + `tier`; `card.variant` + `featured` |
| `contentful/add-help-guide.cjs` | Help page: 30 cards and their headings/links, section, metaData, page |
| `contentful/add-sponsors-page.cjs` | Sponsors page: why cards, tiers, contact link, sections, metaData |
| `contentful/set-heading-accents.cjs` | Splits page titles into heading + accent (community, privacy, mission, history, sponsors, policies) |
| `contentful/fix-page-names.cjs` | Gives pages their own `pageName` heading (see above) |

All of these have been applied to `master`. The content scripts run as a dry run by default and
write only with `--publish`. They are idempotent, because they create or overwrite fixed entry ids.
