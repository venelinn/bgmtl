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
app/                 # Next.js App Router — app/[lang]/[[...slug]], events, news, api/revalidate
components/          # Reusable UI (Events, News, Listings, Forms, Navigation, Membership, Donate, ...)
constants/          # SUPPORTED_LOCALES and other shared constants
context/            # React context providers (navigation, transitions)
contentful/         # Contentful export/import scripts, migrations, and content export
hooks/              # Custom React hooks
messages/           # next-intl translation dictionaries
scripts/            # Contentful import/export/migration node scripts
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
| `MAILCHIMP_API_KEY` / `MAILCHIMP_LIST_ID` | Newsletter subscriptions |

### 3. Run the dev server

```bash
pnpm dev
```

This builds the design-token dictionary and starts Next.js on [localhost:3015](http://localhost:3015).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Build design tokens, then run the dev server on port 3015 |
| `pnpm build` | Clean, build design tokens, then build for production |
| `pnpm start` | Start the production server |
| `pnpm build-dictionary` | Generate design tokens via Style Dictionary |
| `pnpm storybook` | Run Storybook on port 6018 |
| `pnpm lint-format` | Lint and format with Biome (writes fixes) |
| `pnpm contentful:migrate` | Run a Contentful space migration |
| `pnpm contentful:import-bg-community` | Import Bulgarian community content |

## Localization (i18n)

Routing is locale-prefixed via the `app/[lang]` dynamic segment and powered by `next-intl`. Supported locales are defined in [`constants/locales.ts`](./constants/locales.ts) (`SUPPORTED_LOCALES`), and translation dictionaries live in [`messages/`](./messages/). When switching locales, the app navigates to the same route under the selected locale.

## Content & Contentful

Content is managed in Contentful and rendered with `@contentful/rich-text-react-renderer`. Editorial changes are pushed to the site through the on-demand revalidation webhook at `/api/revalidate` (authorized with `CONTENTFUL_REVALIDATE_SECRET`).

Import, export, and migration helpers live in [`contentful/`](./contentful/) and [`scripts/`](./scripts/).

## Deployment

The site is built and deployed on **Netlify** (`pnpm build`); see [`netlify.toml`](./netlify.toml).
