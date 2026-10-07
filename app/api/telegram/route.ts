import type { NextRequest } from "next/server"
import {
	createDraft,
	discardDraft,
	findDuplicates,
	getCategories,
	type ParsedListing,
	parseListing,
	publishDraft,
	TEMPLATE,
} from "@/utils/communityBot"

/** Node runtime: needs contentful-management, not Edge. */
export const runtime = "nodejs"

/**
 * Telegram bot webhook — add Community directory entries by chatting.
 * Setup: docs/telegram-bot.md. Auth is two-layered and fails closed:
 *   1. Telegram's `X-Telegram-Bot-Api-Secret-Token` header must match TELEGRAM_WEBHOOK_SECRET
 *   2. The sender's numeric user id must be in TELEGRAM_ALLOWED_USER_IDS (comma-separated)
 */

const HELP =
	"Add a Community directory listing. Send a message in this format (only Name is required; labels can be in Bulgarian too):\n\n" +
	`<pre>${TEMPLATE}</pre>\n` +
	"I'll show a preview — tap ✅ Publish or ❌ Discard. Send /new to see this again.\n\n" +
	"Category must be one that exists on the site (e.g. food, school, church, plumber…)."

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

async function tg(method: string, body: Record<string, unknown>) {
	const res = await fetch(
		`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,
		{
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		},
	)
	if (!res.ok)
		console.error(
			`telegram ${method} failed`,
			res.status,
			await res.text().catch(() => ""),
		)
}

const say = (
	chatId: number,
	text: string,
	extra: Record<string, unknown> = {},
) =>
	tg("sendMessage", {
		chat_id: chatId,
		text,
		parse_mode: "HTML",
		link_preview_options: { is_disabled: true },
		...extra,
	})

function preview(
	l: ParsedListing,
	labels: Map<string, string>,
	dupes: string[],
) {
	const rows = [
		`<b>${esc(l.name)}</b>`,
		`📍 city: ${esc(l.city)}`,
		`🏷 ${l.categories.length ? l.categories.map((s) => esc(labels.get(s) ?? s)).join(", ") : "<i>no category — will list under “All” only</i>"}`,
		l.phone && `☎ ${esc(l.phone)}`,
		l.email && `✉ ${esc(l.email)}`,
		l.website && `🔗 ${esc(l.website)}`,
		l.address && `🏠 ${esc(l.address)}`,
		l.unknownCategories.length > 0 &&
			`⚠️ Unknown category: ${l.unknownCategories.map(esc).join(", ")} (not saved — use /new to see valid ones, or add it in Contentful first)`,
		l.unmapped && `<i>Not saved: ${esc(l.unmapped)}</i>`,
		dupes.length &&
			`\n⚠️ Similar entries already exist: ${dupes.map(esc).join("; ")}`,
	].filter(Boolean)
	return rows.join("\n")
}

async function onMessage(msg: any, updateId: number) {
	const chatId: number = msg.chat.id
	const text: string = (msg.text ?? msg.caption ?? "").trim()

	if (!text || /^\/(start|help|new)\b/.test(text)) return say(chatId, HELP)
	if (/facebook\.com\/events|fb\.me\/e\//i.test(text)) {
		return say(
			chatId,
			"Facebook events aren't supported yet — coming soon. For now, send me community listings.",
		)
	}

	const categories = await getCategories()
	const listing = parseListing(text, categories)
	const dupes = await findDuplicates(listing.name, listing.city)
	const entryId = await createDraft(listing, updateId)
	const labels = new Map(categories.map((c) => [c.slug, c.label]))

	return say(chatId, preview(listing, labels, dupes), {
		reply_markup: {
			inline_keyboard: [
				[
					{ text: "✅ Publish", callback_data: `pub:${entryId}` },
					{ text: "❌ Discard", callback_data: `del:${entryId}` },
				],
			],
		},
	})
}

async function onCallback(cb: any) {
	const [action, entryId] = String(cb.data ?? "").split(":")
	const chatId: number = cb.message.chat.id
	const messageId: number = cb.message.message_id
	const done = (note: string) =>
		Promise.all([
			tg("answerCallbackQuery", { callback_query_id: cb.id }),
			// Remove the buttons so a second tap can't double-fire, and say what happened.
			tg("editMessageReplyMarkup", {
				chat_id: chatId,
				message_id: messageId,
				reply_markup: { inline_keyboard: [] },
			}),
			say(chatId, note, { reply_to_message_id: messageId }),
		])

	if (action === "pub") {
		await publishDraft(entryId)
		return done("✅ Published. It will show on the site in a moment.")
	}
	if (action === "del") {
		return done(
			(await discardDraft(entryId))
				? "🗑 Discarded."
				: "That entry is already published — remove it in Contentful.",
		)
	}
	return tg("answerCallbackQuery", { callback_query_id: cb.id })
}

export async function POST(req: NextRequest) {
	const secret = process.env.TELEGRAM_WEBHOOK_SECRET
	const allowed = (process.env.TELEGRAM_ALLOWED_USER_IDS ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
	if (!secret || !process.env.TELEGRAM_BOT_TOKEN || allowed.length === 0) {
		return Response.json(
			{ error: "Telegram bot is not configured" },
			{ status: 500 },
		)
	}
	if (req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
		return Response.json({ error: "Unauthorized" }, { status: 401 })
	}

	const update = await req.json().catch(() => null)
	if (!update) return Response.json({ ok: true })

	const from = update.message?.from ?? update.callback_query?.from
	if (!from || !allowed.includes(String(from.id))) {
		// Silently ignore strangers (200 so Telegram doesn't retry).
		return Response.json({ ok: true })
	}

	const chatId =
		update.message?.chat.id ?? update.callback_query?.message?.chat.id
	try {
		if (update.message) await onMessage(update.message, update.update_id)
		else if (update.callback_query) await onCallback(update.callback_query)
	} catch (err: any) {
		console.error("telegram bot error:", err)
		if (chatId)
			await say(chatId, `⚠️ ${esc(err?.message ?? "Something went wrong")}`)
	}
	// Always 200 — a non-2xx makes Telegram redeliver the same update.
	return Response.json({ ok: true })
}
