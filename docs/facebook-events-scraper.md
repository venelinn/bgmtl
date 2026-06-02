# Facebook events scraper

Pull events from the public Facebook group ("Bulgarians in Montreal") into the
Contentful import format, translated into **bg-BG / en-CA / fr-CA**.

The pipeline has three steps, each a separate script so a failure in one stage
never corrupts the next:

```
Facebook ─scrape─▶ _scraped/<year>.raw.json ─build─▶ events_<year>.json ─import─▶ Contentful
                                            └──────────── covers ──────────────────────▶ Cloudinary + Contentful
```

## One-time setup

1. **Install the Playwright browser** (only if it's missing):
   ```bash
   npx playwright install chromium
   ```
2. **Save a Facebook login session.** Group events only render for logged-in
   users, so we reuse a real session:
   ```bash
   pnpm events:login
   ```
   A browser opens → log into Facebook → press ENTER in the terminal. This
   writes `.fb-session.json` (gitignored — never commit it). Re-run whenever
   the session expires.
3. **Add a DeepL key** to `.env` for auto-translation (optional but recommended):
   ```
   DEEPL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
   ```
   Free-tier keys end in `:fx`. Without a key, text stays in its source
   language and you translate by hand.
4. **Add Cloudinary credentials** to `.env` for cover-image upload (optional —
   only needed for `events:covers`):
   ```
   CLOUDINARY_CLOUD_NAME=dgly3nv8f
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

## Each time you want to refresh events

```bash
pnpm events:scrape -- --year 2026      # → mockData/events/_scraped/2026.raw.json
pnpm events:build 2026                 # → mockData/events/events_2026.json  (translated)
pnpm events:import events_2026         # → Contentful (needs CONTENTFUL_MANAGEMENT_TOKEN)
pnpm events:covers 2026                # → upload FB covers to Cloudinary + attach to events
```

Always **eyeball `mockData/events/events_2026.json`** before importing — fix any entry
flagged with `needsReview` (a date the scraper couldn't parse) and tidy
machine translations.

`events:covers` matches each event to its scraped cover (by Facebook event id),
uploads it to Cloudinary, and writes the event's `cover` field in the
cloudinaryAsset shape — **skipping any event that already has a cover**, so
manual covers are never overwritten. Facebook image URLs expire within days, so
run it soon after scraping. Note: covers upload to the `CLOUDINARY_CLOUD_NAME`
cloud (`dgly3nv8f`); older covers on cloud `dysoiulfl` won't appear in that
cloud's Contentful media picker but still render on the site.

### Choosing what to scrape from

Source precedence (first match wins): **`--url` › `--group` / `FB_GROUP_ID` › default group**.

```bash
# by group id (default group is BG-MTL)
pnpm events:scrape -- --group 958440790893938 --year 2026

# by full URL — group OR page, numeric id OR vanity name. A bare group/page
# URL gets "/events" appended automatically.
pnpm events:scrape -- --url https://www.facebook.com/groups/958440790893938/events
pnpm events:scrape -- --url facebook.com/SomePageName            # → .../SomePageName/events
```

You can also set `FB_EVENTS_URL` (or `FB_GROUP_ID`) in `.env` instead of passing a flag.

### Useful scrape flags

| Flag | Purpose |
|------|---------|
| `--url <url>` | Full events-listing URL to scrape (group or page) |
| `--group <id>` | Group id to scrape (default: the BG-MTL group) |
| `--year 2026` | Which year to keep (default: current year) |
| `--tz <zone>` | Timezone for event start times (default `America/Toronto`) |
| `--headed` | Show the browser while scraping (debugging) |
| `--debug` | Dump each event's HTML text + screenshot to `_scraped/debug/` |
| `--scrolls 60` | Max scroll passes on the events list (default 40) |

### Scrape a single event

To grab just one event (e.g. one a member shared) without re-scraping the whole
list, use `events:scrape-one` with an event URL or id:

```bash
pnpm events:scrape-one -- https://www.facebook.com/events/1534058694748503/
pnpm events:scrape-one -- 1534058694748503 --tz America/Toronto
```

It prints the record and saves `_scraped/event-<id>.raw.json` (same envelope as
the year files, so it can be merged into one and fed to `events:build`). Both
scrapers share the extraction logic in `scripts/lib/fb-extract.js`.

### Add a single event straight to Contentful

`events:add` does the whole pipeline for one URL — scrape → translate → create
event + heading → upload + attach cover → publish — in a single command:

```bash
pnpm events:add -- https://www.facebook.com/events/1605426171589137/
pnpm events:add -- <url> --dry        # scrape + translate + preview, no writes
pnpm events:add -- <url> --no-cover   # skip the cover upload
```

IDs are **date-stamped** (`event-<slug>-<YYYY-MM-DD>`) so recurring events that
share a title (e.g. a monthly bazaar) don't collide; it refuses to overwrite an
event id that already exists. Needs `CONTENTFUL_MANAGEMENT_TOKEN`, `DEEPL_API_KEY`,
and the Cloudinary creds (unless `--no-cover`).

> Shared logic lives in `scripts/lib/`: `fb-extract` (scraping), `deepl`
> (translation), `events-format` (entry shaping), `cloudinary` (cover upload).

## How it maps to Contentful

Each scraped event produces:

- one **`event`** entry — `date`/`doorsOpen` from the start time, localized
  `venue`, `excerpt`, `content`; `heading` links to:
- one **`heading`** entry — the localized display title.

IDs are `event-<slug>-<year>` / `heading-<slug>-<year>`, where the slug is
derived from the English title (Cyrillic is transliterated).

## When Facebook changes its DOM

Facebook obfuscates and frequently changes its markup, so the scraper leans on
several fallbacks (`og:` meta tags, embedded JSON timestamps, visible text) and
records the raw date string it found. If an event won't parse:

1. Re-run with `--debug --headed` and inspect `_scraped/debug/<id>.txt`.
2. Adjust the extraction logic in `scripts/scrape-fb-events.js`
   (`extractEvent`), or hand-fix the date in `_scraped/<year>.raw.json` and
   re-run `events:build`.
