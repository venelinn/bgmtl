# Community Directory

The city "address book" (e.g. `/community` → Montreal): a searchable, filterable
list of Bulgarian orgs, businesses, churches, schools and professionals.

## Content model

Each listing is a dedicated **`directoryEntry`** content type (NOT the generic
`card` type — that was the old approach, replaced 2026-06):

| Field        | Type                              | Localized | Notes |
|--------------|-----------------------------------|-----------|-------|
| `name`       | Symbol                            | ✅ (req.) | display name, rendered via `<Heading>` |
| `city`       | Symbol (req.)                     | —         | lowercase slug, e.g. `montreal` — drives which directory it appears in |
| `categories` | Array<Link → `communityCategory`> | —         | the filterable **tags** (one or many) |
| `phone`      | Symbol                            | —         | raw number; card builds `tel:` |
| `email`      | Symbol                            | —         | card builds `mailto:` |
| `website`    | Symbol                            | —         | full URL; card footer external link |
| `address`    | Symbol                            | —         | shown with a map-pin icon |
| `logo`       | Cloudinary asset                  | —         | rendered top-right of the card; URL resolved via `getFallbackImageUrl` |

`name` is the only required + localized field, so it must carry a value in **every**
space locale (`en-CA`, `bg-BG`, `fr-CA`) or publish fails. Default locale is `bg-BG`.

### Taxonomy (the tags)

Tags are a controlled vocabulary, not free text — a single tier:

- **`communityCategory`** — a category (slug + label + order), e.g. `plumber`,
  `church`, `school`. These are the filter chips / dropdown options.

> The filter is **single-tier**. An earlier design had a top-level
> **`communityGroup`** tier (Community, Faith, Services…) above categories, but
> that browse tier was never wired into the live component. It was removed
> (2026-06): the `communityGroup` content type and its entries, plus the
> `communityCategory.group` link field, were deleted directly in Contentful, and
> the `groups`/`groupSlug` keys were dropped from `community-taxonomy.json`.

Source of truth: [`mockData/bg-community/community-taxonomy.json`](../mockData/bg-community/community-taxonomy.json).
A `directoryEntry`'s `categories` link to `communityCategory` entries. A tag whose
category isn't in the taxonomy still lists under "All" but gets no filter chip — so
add the category first.

## How it renders

Query-driven by `city`, no manual collection wiring:

```
page (communityDirectory section, city="montreal")
  → DirectoryConnector            components/Directory/DirectoryConnector.tsx
    → getCommunityDirectory(city) utils/content.ts   (fetches directoryEntry + taxonomy)
      → FilterableDirectory       (client: category dropdown, search, A→Z index)
        → DirectoryCard           (name + logo + tag chips + icon rows: address/phone/email/website)
```

- Filter is single-tier: one category dropdown ("All" + every category that has
  listings, ordered by the CMS `order`).
- Card tag chips mirror the active filter chip; dark mode uses the lifted `--primary`
  accent (see `DirectoryCard.module.scss`).

## Adding / editing entries

**As an editor:** create a `directoryEntry`, set `name`, `city` (lowercase, e.g.
`montreal`), pick one or more `categories`, fill phone/email/website/address. Publish.
It appears in that city's directory automatically.

**Batch entry:** fill [`mockData/bg-community/data.md`](../mockData/bg-community/data.md)
(one block per org; `Tags` = comma-separated category slugs), then convert to entries.

## Scripts & migrations

The migration **CLI can't create entries** in this space — content-type changes go
through `contentful space migration`, but entry create/copy goes through Management
SDK `.cjs` scripts.

| File | What |
|------|------|
| [`migration/2026-06-06-directory-entry-model.js`](../contentful/migration/2026-06-06-directory-entry-model.js) | creates the `directoryEntry` content type |
| [`migration/2026-06-07-directory-entry-simplify-locales.js`](../contentful/migration/2026-06-07-directory-entry-simplify-locales.js) | makes `website` + `address` non-localized |
| [`migrate-directory-entries.cjs`](../contentful/migrate-directory-entries.cjs) | **non-destructive** copy of old `card`s → `directoryEntry` (idempotent; leaves cards in place; parses contact info from the card's rich text) |
| [`seed-community-directory.cjs`](../contentful/seed-community-directory.cjs) | seeds the taxonomy (groups + categories) + the Montreal page/section from `community-taxonomy.json` |

Run a content-type migration:

```bash
node -e 'require("dotenv").config(); require("child_process").execFileSync(
  "node_modules/.bin/contentful",
  ["space","migration","--yes",
   "--space-id", process.env.CONTENTFUL_SPACE_ID,
   "--environment-id", process.env.CONTENTFUL_ENVIRONMENT||"master",
   "--management-token", process.env.CONTENTFUL_MANAGEMENT_TOKEN,
   "contentful/migration/<file>.js"], {stdio:"inherit"});'
```

(`pnpm run contentful:migrate -- <file>` mangles flags via the extra `--`, and the
dotenvx banner pollutes `$(node -e …)` command-substitution — invoke the binary
directly as above.)

### Gotchas
- **Content-type quota** is 25; creating `directoryEntry` uses a slot.
- **`CONTENTFUL_HOST`** in `.env` may point at the **preview** host — pass
  `host: "cdn.contentful.com"` explicitly when verifying *published* delivery output.
- After publishing, **restart the dev server** — the Contentful layer caches in-process
  in dev (`devMemo`); prod uses the webhook-driven cache (see
  [`contentful-strategy-export.md`](./contentful-strategy-export.md)).
