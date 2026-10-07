# Telegram bot — add content by chat

Phase 1: **Community directory entries**. Phase 2 (planned): Facebook events.

```
Telegram message ─▶ POST /api/telegram ─▶ parse "Label: value" lines (categories matched to the live taxonomy)
                                         ─▶ unpublished directoryEntry draft in Contentful  (= the preview)
                    bot replies with preview + [✅ Publish] [❌ Discard]
✅ ─▶ draft published ─▶ existing Contentful webhook revalidates the site
❌ ─▶ draft deleted
```

Stateless: the buttons carry only the draft id (`directory-entry-tg-<update_id>`), so no DB.
A Telegram retry of the same message reuses the same draft. Only `directory-entry-tg-*` ids
can be published/discarded via the buttons.

Code: [`app/api/telegram/route.ts`](../app/api/telegram/route.ts), [`utils/communityBot.ts`](../utils/communityBot.ts).

## Setup
1. Telegram → **@BotFather** → `/newbot` → copy the token.
2. Get your numeric user id from **@userinfobot**.
3. Set on the host (Netlify) and in `.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`
   (any long random string), `TELEGRAM_ALLOWED_USER_IDS`, plus
   `CONTENTFUL_MANAGEMENT_TOKEN` / `CONTENTFUL_SPACE_ID` (the bot writes to Contentful at runtime).
4. Deploy, then register the webhook: `pnpm telegram:webhook https://bgmtl.com`
   (`--info` to check, `--delete` to remove).

## Adding a listing: `/add` (guided) or `/new` (template)
**`/add`** — the bot asks one question at a time; you *reply* to each (send `-` to skip):
name → English name → categories (tap buttons, then ➡️ Done) → phone → email → website → address → note → English note → preview.
Stateless: each question has a `ref <draftId> · <step>` footer, so a reply tells the bot which draft and step it belongs to;
answers are saved straight into the unpublished Contentful draft. Reply `/cancel` to any question to drop the listing.
Abandoned half-finished drafts stay in Contentful as unpublished `directory-entry-tg-*` entries (safe to delete).

**`/new`** — one-shot template (below). `/categories` lists valid categories. `pnpm telegram:webhook <site>` also
registers the command menu.

## Message format (`/new`)
Only Telegram + Contentful are involved — no AI service. Send `/new` in the bot for the template, `/categories` for the valid categories:

```
Name: Българска пекарна Роза
Name EN: Roza Bulgarian Bakery
Category: food
City: montreal
Phone: 514-555-0100
Email: info@roza.ca
Website: https://roza.ca
Address: 123 Rue Saint-Denis, Montréal
Note: Отворено всеки ден 8–18
Note EN: Open daily 8–18
```
Only `Name` is required. Labels are case-insensitive and may be Bulgarian (Име, Категория, Град, Тел, Имейл, Сайт, Адрес).
`Category` takes slugs or labels in any locale, comma-separated; unknown ones are flagged in the preview and not saved.
**Languages:** `Name` / `Note` apply to every language. Add `Name BG` / `Name EN` / `Name FR` (same for `Note`) to
set a specific one. Missing ones are filled automatically (FR takes the EN text first), because `name` must have all three.
No auto-translation is done — type the translations you want.
An unlabeled first line is the name; unlabeled emails/URLs are recognised.

## Security
Fails closed: the webhook secret header must match AND the sender id must be allow-listed;
anyone else is silently ignored.

## Behaviour notes
- `name`/`note` are filled for all three locales as described above (no translation service).
- Default city is `montreal`; categories can only be ones that exist in Contentful.
- Duplicate names in the same city are flagged in the preview (still your call).
- To fix a field, discard and resend (or edit the entry in Contentful after publishing).
- Local testing: expose the dev server with a tunnel and point the webhook at it.
