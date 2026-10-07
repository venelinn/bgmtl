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

## Message format
Only Telegram + Contentful are involved — no AI service. Send `/new` in the bot for the template:

```
Name: Българска пекарна Роза
Category: food
City: montreal
Phone: 514-555-0100
Email: info@roza.ca
Website: https://roza.ca
Address: 123 Rue Saint-Denis, Montréal
```
Only `Name` is required. Labels are case-insensitive and may be Bulgarian (Име, Категория, Град, Тел, Имейл, Сайт, Адрес).
`Category` takes slugs or labels in any locale, comma-separated; unknown ones are flagged in the preview and not saved.
An unlabeled first line is the name; unlabeled emails/URLs are recognised.

## Security
Fails closed: the webhook secret header must match AND the sender id must be allow-listed;
anyone else is silently ignored.

## Behaviour notes
- `name` is copied into all three locales (names aren't translated).
- Default city is `montreal`; categories can only be ones that exist in Contentful.
- Duplicate names in the same city are flagged in the preview (still your call).
- To fix a field, discard and resend (or edit the entry in Contentful after publishing).
- Local testing: expose the dev server with a tunnel and point the webhook at it.
