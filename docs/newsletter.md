# Newsletter (Brevo)

Generate a ready-to-send **HTML email of upcoming events** (Bulgarian) and paste
it into Brevo. One script reads live events from Contentful, keeps only what's
upcoming, and writes a responsive, branded email.

```
Contentful (event entries) ─build-newsletter.js─▶ scripts/output/newsletter-bg.html ─paste─▶ Brevo campaign
```

- **Script:** [`scripts/build-newsletter.js`](../scripts/build-newsletter.js)
- **Command:** `pnpm events:newsletter`
- **Output:** `scripts/output/newsletter-bg.html` (gitignored — it's generated, not source)
- **Contacts/list:** already handled elsewhere — the site's signup form pushes
  subscribers to Brevo via [`app/api/subscribe/route.ts`](../app/api/subscribe/route.ts)
  (`BREVO_API_KEY` / `BREVO_LIST_ID`). This doc is only about the **email content**.

---

## What the script does

1. Fetches **published** `event` entries from the Contentful **Delivery API**
   (`bg-BG`, `include=2` so the linked `heading` entry resolves).
2. Keeps only **upcoming** events (date ≥ start of today), sorted **soonest-first** —
   the same ordering as the site's `/events` page.
3. Builds each card: cover thumbnail (Cloudinary, `c_fill,w_560,h_350`), date pill,
   title (links to the live event page), venue, excerpt, "Виж повече →".
4. Wraps it in a branded, responsive shell: logo band, intro paragraphs, section
   label, CTA button, footer with Brevo's `{{ unsubscribe }}` tag.
5. Writes the HTML to `scripts/output/newsletter-bg.html`.

Event detail links are built with the **same slug logic as the live site**
(`utils/common.ts` → `transliterateCyrillic`/`slugify`, mirrored in the script).
If you ever change slug generation in `utils/common.ts`, update the copy in
`build-newsletter.js` too, or newsletter links will 404.

---

## Routine: send a newsletter

1. **Generate the HTML:**
   ```bash
   pnpm events:newsletter
   ```
   The console prints how many upcoming events were found and lists them — sanity-check
   that the list looks right before sending.

   Options:
   ```bash
   pnpm events:newsletter --limit 6                 # cap the number of events (default 8)
   pnpm events:newsletter --out /tmp/newsletter.html # write somewhere else
   ```

2. **Preview locally** (optional but recommended):
   open `scripts/output/newsletter-bg.html` in a browser, and resize the window
   narrow to confirm the responsive (mobile) layout stacks correctly.

3. **Create the campaign in Brevo:**
   - Brevo → **Campaigns → Email → Create a campaign**.
   - Choose the **"Paste your code" / custom-HTML** editor (not drag-and-drop).
   - Open `scripts/output/newsletter-bg.html`, **select all → copy**, paste into Brevo.
   - Set sender, subject, and the recipient **list** (the same Brevo list signups go to).

4. **Send a test** to yourself first (Brevo: "Send a test email"). Check it in
   Gmail web **and** the Gmail/Apple Mail phone app — that's the real responsive test.

5. **Schedule or send.** Brevo fills `{{ unsubscribe }}` automatically; you don't
   touch it.

---

## Updating the design

All layout/branding lives in `scripts/build-newsletter.js`:

| What | Where in the script |
|------|---------------------|
| Brand colors (navy / cyan / green) | `NAVY`, `ACCENT`, `GREEN` constants — mirror `styles/_css-variables.css` |
| Logo image | `LOGO_URL` constant (see below) |
| Intro greeting + paragraphs | `buildHtml()` → "intro" `<tr>` |
| Section label ("✨ Предстоящи събития") | `buildHtml()` → "section label" `<tr>` |
| One event card markup | `eventCard()` |
| CTA button / footer | `buildHtml()` → "CTA" / "footer" `<tr>` |
| Responsive rules | `buildHtml()` → `<style>` block (`@media max-width:600px`) |
| Date wording (Bulgarian) | `formatDateBg()`, `BG_MONTHS`, `BG_WEEKDAYS` |
| Thumbnail size/crop | `thumbUrl()` and its call in `fetchUpcomingEvents()` |

**Email-HTML rules to keep:** inline styles on every element (the `<style>` block
is for responsive overrides only — many clients strip `<head>` CSS), table-based
layout, fixed 600px container, absolute image URLs. Don't reach for flexbox/grid.

---

## The logo

The email logo is the **live site logo**, a Cloudinary **SVG** (`logo1_c9vany.svg`,
the one in the nav). Email clients don't render SVG, so the script rasterizes it
on the fly with Cloudinary's format transform (no stored PNG to maintain):

```
https://res.cloudinary.com/dgly3nv8f/image/upload/f_png,q_auto,w_440/v1780354271/logo1_c9vany.svg
```

- `f_png` = rasterize the vector to PNG (keeps transparency, so it sits on the
  navy band correctly).
- `w_440` = 2× the ~210px display width, for retina.

**If the logo changes** (new Contentful nav logo): grab the new Cloudinary URL —
fastest way is `curl -s https://bgmtl.com | grep -oE 'res\.cloudinary\.com/[^" ]+logo[^" ]*'` —
and update `LOGO_URL`, keeping the `f_png,q_auto,w_440` transform.

> ⚠️ `components/Icons/Logo.jsx` is **dead boilerplate** (a "DREAM BOAT" wordmark
> from another project) — it is **not** the bgmtl logo. Don't use it.

---

## Environment

Reuses existing `.env` keys — nothing new to add:

| Var | Used for |
|-----|----------|
| `CONTENTFUL_SPACE_ID` | space (default `huajfyusfsch`) |
| `CONTENTFUL_ENVIRONMENT` | environment (default `master`) |
| `CONTENTFUL_DELIVERY_TOKEN` | **required** — read published events |
| `NEXT_PUBLIC_BASE_URL` | event link base (default `https://bgmtl.com`) |
| `NEXT_PUBLIC_SITE_NAME` | shown in footer (default `bgmtl.com`) |

The script pins the Delivery host to `cdn.contentful.com`, ignoring
`CONTENTFUL_HOST` (which is set to `preview.contentful.com` for the app's preview
mode) — so it always reads **published** content, not drafts.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| "No upcoming events found" | No events with a future date in Contentful. Add/publish events, or check the `date` field is set. |
| Event link 404s | Slug logic drifted from `utils/common.ts`. Re-sync the `CYRILLIC_MAP`/`slugify` copy in the script. |
| Logo missing/broken in email | `LOGO_URL` stale, or `f_png` dropped. Re-fetch the logo URL (see "The logo"). |
| `"· 00:00 ч."` on an event | The event's `date` has a midnight time (all-day). Optional: suppress time when `00:00` in `formatDateBg()`. |
| Images look soft on mobile | Bump the `thumbUrl(..., w, h)` size in `fetchUpcomingEvents()`. |

---

## Possible future automation

Currently **generate → paste manually** (chosen for the review-before-send safety).
If you later want it hands-off, the same event data can push a **Brevo draft
template/campaign** via the API (`POST /v3/smtp/templates`, you already have
`BREVO_API_KEY`). Would be an `--push` flag on the script. Not built yet.
