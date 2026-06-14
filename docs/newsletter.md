# Newsletter (Brevo)

Build a branded, responsive **HTML email** of events/news (Bulgarian) and get it
into Brevo. There are **two ways** to produce the exact same email — pick per
occasion:

```
                                ┌─ CLI:  pnpm events:newsletter ─▶ scripts/output/newsletter-bg.html ─paste─▶ Brevo
Contentful (events / news) ─────┤
                                └─ CMS:  newsletter entry (Status: Draft|Send) ─publish─▶ webhook ─▶ Brevo draft / send
```

Both paths share **one renderer** ([`scripts/lib/newsletter-render.js`](../scripts/lib/newsletter-render.js)),
so the email is identical whichever you use. The Brevo *contacts/list* side is
separate — the signup form pushes subscribers via
[`app/api/subscribe/route.ts`](../app/api/subscribe/route.ts). This doc is about
the **email content**.

**Path A** (CLI) is for developers and never sends — it writes a file you paste.
**Path B** (CMS) is **self-service for non-technical editors** — create, preview,
and send entirely inside Contentful (the `Send` status emails the list; `Draft`
just prepares a Brevo draft).

---

## Path A — manual CLI (simplest; build from your editor)

The original, dependency-free flow. Generates the HTML file; you paste it into Brevo.

```bash
pnpm events:newsletter                 # all upcoming events (default) → scripts/output/newsletter-bg.html
pnpm events:newsletter --mode news     # latest news
pnpm events:newsletter --mode eventsAndNews
pnpm events:newsletter --mode selectedEvents --events <id1>,<id2>
pnpm events:newsletter --entry <newsletterEntryId>   # read mode/intro/events from a CMS entry
pnpm events:newsletter --limit 6 --out /tmp/x.html
pnpm events:newsletter --entry <id> --brevo-draft     # also create the Brevo draft via API
```

- **Default behavior is unchanged**: no args → all upcoming events → writes
  `scripts/output/newsletter-bg.html` (gitignored). Open it, copy, paste into a
  Brevo **custom-HTML** campaign (Campaigns → Email → "Paste your code").
- Reads **published** content from the Contentful **Delivery API** (pins
  `cdn.contentful.com`, ignoring `CONTENTFUL_HOST`'s preview setting).
- Event/news links use the **same slug logic as the live site** (`utils/common.ts`
  `slugify`, mirrored in `build-newsletter.js`). If you change slug generation in
  `utils/common.ts`, update that copy too or links will 404.

## Path B — CMS, fully self-service (no code, no Brevo login)

An editor does everything in Contentful:

1. Create a **Newsletter** entry; pick a `contentMode`, write `subject`/`intro`,
   (and pick `events` for `selectedEvents`).
2. **Preview** it: the entry's "Open preview" button renders the real email
   (including unpublished edits) via
   [`app/api/newsletter/preview/route.ts`](../app/api/newsletter/preview/route.ts).
3. Set **Status** and **Publish**:
   - `Draft` → the webhook creates/updates a Brevo **draft** (nothing is sent).
   - `Send` → the webhook **emails the whole list** (Brevo `sendNow`).
4. On publish, Contentful calls `POST /api/newsletter`
   ([`app/api/newsletter/route.ts`](../app/api/newsletter/route.ts)) →
   [`processNewsletterEntry`](../utils/newsletter.ts).

**Double-send guard:** after a send the system writes `sentAt`, `brevoCampaignId`
and flips `status` to `sent` (via the Management API). Re-publishing a sent entry
is a no-op. To deliberately re-send, clear `sentAt`. In `Draft` mode the same
Brevo draft is updated in place on each publish (no pile-up).

> The endpoint reads the entry **fresh via the Management API** (not the cached
> Delivery API), so it always sees the just-published values.

---

## Content modes

The `contentMode` field (CLI: `--mode`) decides what goes in:

| Mode | Contents |
|---|---|
| `upcomingEvents` *(default)* | All upcoming events, soonest-first |
| `selectedEvents` | Only the events in the entry's `events` field, in that order (CLI: `--events <ids>`) |
| `news` | Latest news, newest-first |
| `eventsAndNews` | Upcoming events section **+** latest news section |

`maxItems` caps each section (default 8). Empty sections are omitted automatically.

## The "newsletter" content type (Path B)

Created by two migrations:
[`…create-newsletter-content-type.js`](../contentful/migration/2026-06-13-create-newsletter-content-type.js)
and [`…add-newsletter-send-fields.js`](../contentful/migration/2026-06-13-add-newsletter-send-fields.js).

| Field | Type | Purpose |
|---|---|---|
| `title` | Symbol | Internal label (not in the email) |
| `subject` | Symbol | Email subject line |
| `preheader` | Symbol | Inbox preview text (optional) |
| `intro` | Text | Greeting paragraphs (blank line = new paragraph; empty = default) |
| `contentMode` | Symbol (dropdown) | One of the four modes |
| `events` | Array→Entry(event) | Used by `selectedEvents`; order = email order |
| `maxItems` | Integer | Optional per-section cap |
| `status` | Symbol (dropdown) | `draft` (default) · `send` · `sent` (system) |
| `brevoCampaignId` | Symbol | **Auto** — links to the Brevo campaign; don't edit |
| `sentAt` | Date | **Auto** — set on send; the double-send guard |

---

## One-time setup (external dashboards — done by you)

> The content-type migrations have already been run against `master`. The rest is
> Brevo + env + webhook config.

1. **(Already done) Content type:**
   ```bash
   node scripts/run-migration.js contentful/migration/2026-06-13-create-newsletter-content-type.js
   node scripts/run-migration.js contentful/migration/2026-06-13-add-newsletter-send-fields.js
   ```
2. **Brevo:** verify a sender / authenticate the domain (Senders & Domains), note
   the sender email. Brevo won't send from an unverified address.
3. **Env vars** — set locally (`.env`) and in Netlify (prod):
   | Var | For |
   |---|---|
   | `BREVO_API_KEY`, `BREVO_LIST_ID` | Brevo API + target list |
   | `BREVO_SENDER_NAME`, `BREVO_SENDER_EMAIL` | the campaign "from" |
   | `NEWSLETTER_WEBHOOK_SECRET` | auth for `/api/newsletter` + preview |
   | `CONTENTFUL_MANAGEMENT_TOKEN`, `CONTENTFUL_SPACE_ID` | endpoint reads the entry fresh + writes back send state |
4. **Contentful webhook:** Settings → Webhooks → `POST https://bgmtl.com/api/newsletter`,
   header `x-newsletter-secret: <NEWSLETTER_WEBHOOK_SECRET>`, **filter** content
   type = `newsletter`, **trigger** = Entry **Publish**. (Scoped to `newsletter`
   so ordinary event/news edits never fire it; the system's own write-back publish
   is absorbed by the `sentAt` guard.)
5. **Contentful preview:** Settings → Content preview → add a platform with URL
   `https://bgmtl.com/api/newsletter/preview?id={entry.sys.id}&secret=<NEWSLETTER_WEBHOOK_SECRET>`
   applied to the `newsletter` type. Editors then get an "Open preview" button.

---

## Sending

**Path B (editor, in Contentful):** set **Status = Send** and Publish → it emails
the list. (Status = Draft → a Brevo draft only.) `{{ unsubscribe }}` is filled by
Brevo automatically.

**Path A (developer):** paste `scripts/output/newsletter-bg.html` into a Brevo
**custom-HTML** campaign, set sender/subject/list, send.

Either way: **send a test to yourself first** and check Gmail web **and** the
phone app (the real responsive test) before the real send.

---

## Updating the design

All presentation lives in [`scripts/lib/newsletter-render.js`](../scripts/lib/newsletter-render.js)
(shared by both paths — edit once, both update):

| What | Where |
|---|---|
| Brand colors (navy/cyan/green) | `NAVY` / `ACCENT` / `GREEN` |
| Logo | `LOGO_URL` (Cloudinary `f_png` of the nav SVG — see below) |
| Default intro / preheader | `DEFAULT_INTRO` / `DEFAULT_PREHEADER` |
| Card markup | `card()` |
| Section label block | `sectionBlock()` |
| Overall shell / CTA / footer | `renderNewsletter()` |
| Responsive rules | `<style>` in `renderNewsletter()` (`@media max-width:600px`) |
| Date wording (Bulgarian; hides 00:00) | `formatDateBg()` |

`scripts/lib/newsletter-render.d.ts` types it for the TS app. Keep email-HTML
rules: inline styles, table layout, 600px container, absolute URLs.

## The logo

Email clients don't render SVG, so the nav logo (Cloudinary SVG `logo1_c9vany.svg`)
is rasterized on the fly with `f_png`:

```
https://res.cloudinary.com/dgly3nv8f/image/upload/f_png,q_auto,w_440/v1780354271/logo1_c9vany.svg
```

If the nav logo changes, grab the new URL
(`curl -s https://bgmtl.com | grep -oE 'res\.cloudinary\.com/[^" ]+logo[^" ]*'`)
and update `LOGO_URL`, keeping `f_png,q_auto,w_440`.

> ⚠️ `components/Icons/Logo.jsx` is dead "DREAM BOAT" boilerplate — **not** the logo.

---

## Testing

```bash
# Path A — any mode, no Brevo:
pnpm events:newsletter --mode eventsAndNews --out /tmp/nl.html

# Path B — endpoint dry run (returns HTML, never touches Brevo).
# Entry-less form for quick checks:
curl -s -X POST "http://localhost:3020/api/newsletter?dryRun=1&mode=upcomingEvents" \
  -H "x-newsletter-secret: $NEWSLETTER_WEBHOOK_SECRET" -d '{}'
# Real entry (dryRun never sends, even if Status=Send):
curl -s -X POST "http://localhost:3020/api/newsletter?dryRun=1" \
  -H "x-newsletter-secret: $NEWSLETTER_WEBHOOK_SECRET" \
  -d '{"sys":{"id":"<newsletterEntryId>"}}'

# Preview route (what the editor's "Open preview" hits):
curl -s "http://localhost:3020/api/newsletter/preview?id=<entryId>&secret=$NEWSLETTER_WEBHOOK_SECRET"
```

Then send a Brevo test and check on desktop + phone.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "No items found" | No upcoming events / no news published for that mode. |
| Link 404s | Slug logic drifted from `utils/common.ts`; re-sync the copy in `build-newsletter.js`. |
| Logo missing | `LOGO_URL` stale or `f_png` dropped — re-fetch (see "The logo"). |
| Endpoint 401 | Missing/wrong `x-newsletter-secret` (or `NEWSLETTER_WEBHOOK_SECRET` unset → 500). |
| Endpoint/preview 500 | Usually `CONTENTFUL_MANAGEMENT_TOKEN`/`CONTENTFUL_SPACE_ID` unset (the endpoint reads the entry via the Management API). |
| Publishing didn't send | Status wasn't `send`, or `sentAt` is already set (guard) — clear `sentAt` to re-send. |
| Brevo errors | Need `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_SENDER_EMAIL`; sender must be verified in Brevo. |
| Images soft on mobile | Bump the `thumbUrl(..., w, h)` size. |
