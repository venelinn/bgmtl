# bgmtl

Main website for the **Bulgarian Community in Montreal** and the **Ottawa Region Bulgarian Foundation**.

A Contentful-powered, multilingual [Next.js](https://nextjs.org/) site featuring community news, events, business/community listings, and PayPal-based membership and donations. Deployed on Netlify.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19, TypeScript
- **CMS:** [Contentful](https://www.contentful.com/) (delivery, preview, and management APIs)
- **i18n:** [next-intl](https://next-intl.dev/) — locale-prefixed routing (`/:lang/...`) for English (`en-US`) and French (`fr-CA`)
- **Styling:** Tailwind CSS 4 + SCSS modules, design tokens via [Style Dictionary](https://styledictionary.com/)
- **UI:** Radix UI primitives, Lucide icons, GSAP + ScrollTrigger, Swiper
- **Integrations:** Cloudinary (images), Mailchimp (newsletter), PayPal (membership & donations)
- **Tooling:** [Biome](https://biomejs.dev/) (lint/format), Storybook
- **Package manager:** pnpm
- **Node:** >= 22.12.0

## Project Structure

```
app/                 # Next.js App Router. `app/[lang]/layout.tsx` is the ROOT layout
                     # (renders <html>/<body>); there is no app/layout.tsx — see
                     # docs/app-layout-and-lang.md. Routes: [lang]/[[...slug]], events, news, api
components/          # Reusable UI (Events, News, Listings, Forms, Navigation, Membership, Donate, ...)
constants/          # SUPPORTED_LOCALES and other shared constants
context/            # React context providers (navigation, transitions)
contentful/         # Contentful export/import scripts, migrations, and content export
hooks/              # Custom React hooks
messages/           # next-intl translation dictionaries
mockData/           # Scraped + built Facebook event JSON (events/, events/_scraped/)
docs/               # Longer-form docs (events scraper, newsletter, i18n, revalidation, ...)
scripts/            # Node scripts: Contentful import/export/migration, FB event
                    # pipeline (scrape/build/import/covers/add), newsletter builder
styles/             # Global SCSS, variables, mixins, typography
tokens/             # Style Dictionary design-token config
utils/              # Contentful client, content fetching, localization helpers
public/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js v22.12.0 or later
- pnpm
- A Contentful account & space

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Duplicate `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
| --- | --- |
| `CONTENTFUL_SPACE_ID` | Contentful space (Settings → General) |
| `CONTENTFUL_ENVIRONMENT` | Environment name (default `master`) |
| `CONTENTFUL_DELIVERY_TOKEN` | Content Delivery API token |
| `CONTENTFUL_PREVIEW_TOKEN` | Content Preview API token |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Content Management token (for imports/migrations) |
| `CONTENTFUL_PREVIEW_SECRET` | Secret guarding the preview route |
| `CONTENTFUL_REVALIDATE_SECRET` | Bearer token for the `/api/revalidate` webhook |
| `NEXT_PUBLIC_BASE_URL` | Public site URL |
| `NEXT_PUBLIC_SITE_NAME` | Public site name |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account for image delivery |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_LIST_ID` | Legacy newsletter subscriptions |
| `BREVO_API_KEY` / `BREVO_LIST_ID` | Newsletter list + campaign drafts |
| `BREVO_SENDER_NAME` / `BREVO_SENDER_EMAIL` | Newsletter sender identity |
| `NEWSLETTER_WEBHOOK_SECRET` | Guards the `/api/newsletter` routes |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cover-image uploads (`events:covers`, `events:add`) |
| `DEEPL_API_KEY` | Auto-translation for scraped Facebook events |
| `FB_EVENTS_URL` / `FB_GROUP_ID` | Default Facebook events source to scrape |

### 3. Run the dev server

```bash
pnpm dev
```

This builds the design-token dictionary and starts Next.js on [localhost:3020](http://localhost:3020).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Build design tokens, then run the dev server on port 3020 |
| `pnpm build` | Clean, build design tokens, then build for production |
| `pnpm build:ci` | Same, minus the `clean` step (used by Netlify — keeps the build cache) |
| `pnpm start` | Start the production server |
| `pnpm build-dictionary` | Generate design tokens via Style Dictionary |
| `pnpm storybook` | Run Storybook on port 6018 |
| `pnpm lint-format` | Lint and format with Biome (writes fixes) |
| `pnpm contentful:migrate` | Run a Contentful space migration |
| `pnpm contentful:import-bg-community` | Import Bulgarian community content |
| `pnpm purge-cache` | Force an on-demand revalidation (⚠ defaults to PRODUCTION) |
| `pnpm events:login` | Save a Facebook session to `.fb-session.json` (one-time / on expiry) |
| `pnpm events:scrape` | Scrape a Facebook group/page events list → `mockData/events/_scraped/<year>.raw.json` |
| `pnpm events:scrape-one` | Scrape a single Facebook event by URL or id |
| `pnpm events:build` | Translate + shape a scraped year into `mockData/events/events_<year>.json` |
| `pnpm events:import` | Import a built events JSON into Contentful |
| `pnpm events:covers` | Upload scraped Facebook covers to Cloudinary and attach them |
| `pnpm events:add` | One Facebook event URL → scraped, translated, created, cover attached, published |
| `pnpm events:newsletter` | Build the Brevo newsletter HTML → `scripts/output/newsletter-bg.html` |

## Localization (i18n)

Routing is locale-prefixed via the `app/[lang]` dynamic segment and powered by `next-intl`. Supported locales are defined in [`constants/locales.ts`](./constants/locales.ts) (`SUPPORTED_LOCALES`), and translation dictionaries live in [`messages/`](./messages/). When switching locales, the app navigates to the same route under the selected locale.

`app/[lang]/layout.tsx` **is the root layout**, so `<html lang>` comes from the route param and is correct in the served markup. It previously sat above `[lang]`, hardcoded `lang="en"`, and was patched by a client effect — which crawlers never see, so every locale declared itself English. **Nothing in that layout may call `headers()` or `cookies()`**: a request-time read there opts every route into dynamic rendering and would cost the site its Netlify cache hits.

Adding a locale touches three files — see [`docs/i18n-locales.md`](./docs/i18n-locales.md). Layout and `<html lang>` details: [`docs/app-layout-and-lang.md`](./docs/app-layout-and-lang.md).

## Content & Contentful

Content is managed in Contentful and rendered with `@contentful/rich-text-react-renderer`. Editorial changes are pushed to the site through the on-demand revalidation webhook at `/api/revalidate` (authorized with `CONTENTFUL_REVALIDATE_SECRET`).

Responses are cached with `revalidate: false`, so that webhook is the **only** thing that refreshes deployed content. Two tools exist because the failure is silent — if the secret is missing on the deployment, the route 500s to every caller including the webhook:

```bash
curl -s https://bgmtl.com/api/health    # {"revalidation":"configured"} — can it refresh at all?
pnpm purge-cache                        # force a refresh (⚠ defaults to PRODUCTION)
```

Local `next dev` needs neither — the Contentful cache is skipped in development. See [`docs/on-demand-revalidation.md`](./docs/on-demand-revalidation.md).

### Importing events from Facebook

Events come from the public Facebook group rather than being typed into Contentful by hand. Log in once, then either run the batch pipeline for a whole year or add a single event in one command:

```bash
pnpm events:login                      # one-time: save a FB session (re-run when it expires)

# whole year
pnpm events:scrape -- --year 2026      # → mockData/events/_scraped/2026.raw.json
pnpm events:build 2026                 # → mockData/events/events_2026.json (translated)
pnpm events:import events_2026         # → Contentful
pnpm events:covers 2026                # → covers to Cloudinary, attached to the events

# one event, end to end
pnpm events:add -- https://www.facebook.com/events/1605426171589137/
```

Facebook cover URLs are signed and expire within days, so run the cover step soon after scraping. Always eyeball the built JSON (and the `venue`, which is required to publish) before importing. Full flag reference, gotchas, and what to do when Facebook changes its DOM: [`docs/facebook-events-scraper.md`](./docs/facebook-events-scraper.md).

## Newsletter

`pnpm events:newsletter` renders upcoming events / news / listings into a standalone HTML email you paste into Brevo (or push as a draft with `--brevo-draft`). See [`docs/newsletter.md`](./docs/newsletter.md).

## Scripts & migrations

Import, export, and migration helpers live in [`contentful/`](./contentful/) and [`scripts/`](./scripts/).

## Deployment

The site is built and deployed on **Netlify** (`pnpm build`); see [`netlify.toml`](./netlify.toml).
