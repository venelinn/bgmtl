# Homepage redesign (Stitch mock)

Source: Stitch project `8109149400298636551`, screen `33afbc767bfe4e4aa78b0dc4c9f4d96c`
("Българска Общност в Монреал - Начало & Указател"). The top nav is **out of scope** — it
stays as-is, transparent over the hero.

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
| 1 | Hero | Subtitle, directory search + quick category chips, 2 CTAs, ~75vh. Stats band only with real numbers. | done (live 2026-11-16) |
| 2 | Events + sidebar | Card frame + accent rule (grey for past), red date, 2-line excerpt, footer (read more · ticket), `tags` pills (new field, migration `2026-11-16-event-tags.js`). Calendar "На фокус" card. Shared `listing-card` mixin → news cards get the same frame. No `price` field (by choice). | code done — events need tags in Contentful |
| 3 | Directory | Move above Join; chips with counts; 6 cards; keep real logos; "Add your business" banner → Telegram bot flow. Per-card CTA needs a field. | todo |
| 4 | Newcomer guide (new) | 3 step cards — needs real content (CMS). | phase 2 |
| 5 | News | Featured + 2 side items; graceful with 1 item. | todo |
| 6 | Join | Keep the embroidery image; palette tweak only. | todo |
| 7 | Footer | Light layout, brand blurb, nav/resources columns, legal row. No duplicate newsletter. | todo |

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
- Empty labels fall back to the `Hero` namespace in `messages/*.json`. No quick
  categories picked → first 5 non-empty categories by `order`.
- `HeroConnector` is server-only and is NOT re-exported from `components/Hero/index.ts`
  (a client graph imports that index; re-exporting bundled the connector for the browser
  and crashed the render). Import it from `components/Hero/HeroConnector`.
- Chips (picked or fallback) are filtered to categories with ≥1 Montreal listing —
  `/community/<slug>` 404s for empty categories.

- Link entries in `buttons`: `primary` renders as a white pill, `secondary` as glass.
- `toButtons` drops mapEntry's `type` (content type id "link") so `parseLinkAppearance`
  reads the variant — otherwise every button falls back to `primary`.

Homepage entry setup (saved as **draft** 2026-11-16 — publish with the code deploy): tick `extended`, set `height: two-thirds`, put the subtitle in
`content` (drop the embedded "Присъединете се" link — Join has its own section), pick
quick categories, add two Link entries as `buttons` (Разгледай указателя → `/community`,
Календар със събития → `/events`).
