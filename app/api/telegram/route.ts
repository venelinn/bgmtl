import type { NextRequest } from "next/server"
import {
	type Category,
	createDraft,
	DRAFT_ID_PREFIX,
	discardDraft,
	findDuplicates,
	getCategories,
	getDraft,
	type ParsedListing,
	parseListing,
	publishDraft,
	TEMPLATE,
	updateDraft,
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
	"Add a Community directory listing:\n\n" +
	"➕ /add — I'll ask you a few questions, one at a time (reply to each; send <b>-</b> to skip).\n" +
	"📋 /new — or paste everything in one message using a template.\n" +
	"🏷 /categories — list the categories.\n\n" +
	"At the end I show a preview — tap ✅ Publish or ❌ Discard."

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

/** Show BG/FR variants only when they differ from the EN/display value. */
function localizedRows(v: Record<string, string>, shown: string) {
	return ["bg-BG", "fr-CA"]
		.filter((loc) => v[loc] && v[loc] !== shown)
		.map((loc) => `   ${loc.slice(0, 2).toUpperCase()}: ${esc(v[loc])}`)
}

function preview(
	l: ParsedListing,
	labels: Map<string, string>,
	dupes: string[],
) {
	const rows = [
		`<b>${esc(l.name)}</b>`,
		...localizedRows(l.names, l.name),
		`📍 city: ${esc(l.city)}`,
		`🏷 ${l.categories.length ? l.categories.map((s) => esc(labels.get(s) ?? s)).join(", ") : "<i>no category — will list under “All” only</i>"}`,
		...(l.notes
			? [
					`📝 ${esc(l.notes["en-CA"])}`,
					...localizedRows(l.notes, l.notes["en-CA"]),
				]
			: []),
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

// ── Step-by-step /add flow ────────────────────────────────────────────────
// Stateless: each question carries a "ref <draftId> · <step>" footer; the user
// REPLIES to it, so the footer tells us the draft + step. Answers live in the
// Contentful draft itself.

type Step =
	| "name"
	| "name_en"
	| "categories"
	| "phone"
	| "email"
	| "website"
	| "address"
	| "note"
	| "note_en"

const QUESTIONS: Record<Exclude<Step, "categories">, [string, string]> = {
	name: [
		"What's the <b>name</b>? (as written in Bulgarian / the original)",
		"Name",
	],
	name_en: [
		"Name in <b>English</b>? (send <b>-</b> to use the same)",
		"English name",
	],
	phone: ["<b>Phone</b> number?", "514-555-0100"],
	email: ["<b>Email</b>?", "name@example.com"],
	website: ["<b>Website</b>?", "https://…"],
	address: ["<b>Address</b>?", "123 Rue Saint-Denis, Montréal"],
	note: [
		"Any <b>note</b>? (e.g. services, hours, doctor's name) — in Bulgarian / the original",
		"Note",
	],
	note_en: [
		"That note in <b>English</b>? (send <b>-</b> to use the same)",
		"English note",
	],
}

const ORDER: Step[] = [
	"name",
	"name_en",
	"categories",
	"phone",
	"email",
	"website",
	"address",
	"note",
	"note_en",
]
const isSkip = (t: string) => /^(-|skip|няма|пропусни)$/i.test(t.trim())
const refId = (ref: string) => `${DRAFT_ID_PREFIX}${ref}`

async function ask(chatId: number, ref: string, step: Step) {
	if (step === "categories") return askCategories(chatId, ref)
	const [q, placeholder] = QUESTIONS[step]
	return say(chatId, `${q}\n\n<i>ref ${ref} · ${step}</i>`, {
		reply_markup: { force_reply: true, input_field_placeholder: placeholder },
	})
}

function categoryKeyboard(
	entryId: string,
	cats: Category[],
	selected: string[],
) {
	const buttons = cats.map((c, i) => ({
		text: `${selected.includes(c.slug) ? "✅ " : ""}${c.label}`,
		callback_data: `c:${entryId}:${i}`,
	}))
	const rows: { text: string; callback_data: string }[][] = []
	for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2))
	rows.push([{ text: "➡️ Done", callback_data: `cd:${entryId}` }])
	return { inline_keyboard: rows }
}

async function askCategories(chatId: number, ref: string) {
	const cats = await getCategories()
	return say(
		chatId,
		"Pick the <b>categories</b> (tap to select, then ➡️ Done):",
		{
			reply_markup: categoryKeyboard(refId(ref), cats, []),
		},
	)
}

async function sendPreview(chatId: number, entryId: string) {
	const [listing, categories] = await Promise.all([
		getDraft(entryId),
		getCategories(),
	])
	const dupes = await findDuplicates(listing.name, listing.city, entryId)
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

/** Move on after a step; `skipped` note means the English note is pointless. */
async function advance(
	chatId: number,
	ref: string,
	from: Step,
	skipped = false,
) {
	const next = ORDER[ORDER.indexOf(from) + 1]
	if (!next || (from === "note" && skipped))
		return sendPreview(chatId, refId(ref))
	return ask(chatId, ref, next)
}

async function onAnswer(
	chatId: number,
	ref: string,
	step: Step,
	text: string,
	updateId: number,
) {
	if (/^\/cancel\b/.test(text)) {
		if (ref !== "new") await discardDraft(refId(ref)).catch(() => false)
		return say(chatId, "🗑 Cancelled.")
	}
	const skip = isSkip(text)

	if (step === "name") {
		if (skip)
			return say(chatId, "A name is required — send /add to start again.")
		const entryId = await createDraft(
			{
				name: text,
				names: { "bg-BG": text, "en-CA": text, "fr-CA": text },
				city: "montreal",
				categories: [],
				unknownCategories: [],
			},
			updateId,
		)
		return advance(chatId, entryId.slice(DRAFT_ID_PREFIX.length), "name")
	}

	const entryId = refId(ref)
	switch (step) {
		case "name_en":
			if (!skip)
				await updateDraft(entryId, { names: { "en-CA": text, "fr-CA": text } })
			break
		case "phone":
			if (!skip) await updateDraft(entryId, { phone: text })
			break
		case "email":
			if (!skip) {
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text))
					return say(
						chatId,
						"That doesn't look like an email — reply to the question above again, or send <b>-</b> to skip.",
					)
				await updateDraft(entryId, { email: text })
			}
			break
		case "website":
			if (!skip)
				await updateDraft(entryId, {
					website: /^https?:\/\//i.test(text) ? text : `https://${text}`,
				})
			break
		case "address":
			if (!skip) await updateDraft(entryId, { address: text })
			break
		case "note":
			if (!skip)
				await updateDraft(entryId, {
					notes: { "bg-BG": text, "en-CA": text, "fr-CA": text },
				})
			break
		case "note_en":
			if (!skip)
				await updateDraft(entryId, { notes: { "en-CA": text, "fr-CA": text } })
			break
	}
	return advance(chatId, ref, step, skip)
}

async function onMessage(msg: any, updateId: number) {
	const chatId: number = msg.chat.id
	const text: string = (msg.text ?? msg.caption ?? "").trim()

	if (!text || /^\/(start|help)\b/.test(text)) return say(chatId, HELP)
	if (/^\/add\b/.test(text)) return ask(chatId, "new", "name")
	if (/^\/new\b/.test(text))
		return say(
			chatId,
			`Paste a message in this format (only Name is required; labels can be in Bulgarian; <b>Name EN</b>/<b>Note EN</b> set the English text):\n\n<pre>${TEMPLATE}</pre>`,
		)
	if (/^\/cancel\b/.test(text) && !msg.reply_to_message)
		return say(chatId, "Reply /cancel to a question to drop that listing.")
	if (/^\/categories\b/.test(text)) {
		const cats = await getCategories()
		const lines = cats.map(
			(c) =>
				`<code>${esc(c.slug)}</code> — ${esc([...new Set(c.names)].join(" / "))}`,
		)
		return say(
			chatId,
			`<b>Categories</b> (use the slug or any name; separate several with commas):\n\n${lines.join("\n")}`,
		)
	}

	// A reply to one of our questions → continue the /add flow.
	const footer = msg.reply_to_message?.from?.is_bot
		? String(msg.reply_to_message.text ?? "").match(/ref (new|\d+) · (\w+)\s*$/)
		: null
	if (footer)
		return onAnswer(chatId, footer[1], footer[2] as Step, text, updateId)

	if (/facebook\.com\/events|fb\.me\/e\//i.test(text)) {
		return say(
			chatId,
			"Facebook events aren't supported yet — coming soon. For now, send me community listings.",
		)
	}

	// Free text → one-shot template.
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
	const [action, entryId, arg] = String(cb.data ?? "").split(":")
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

	if (action === "c" || action === "cd") {
		const cats = await getCategories()
		if (action === "c") {
			const slug = cats[Number(arg)]?.slug
			if (!slug) return tg("answerCallbackQuery", { callback_query_id: cb.id })
			const next = await updateDraft(entryId, { toggleCategory: slug })
			return Promise.all([
				tg("answerCallbackQuery", { callback_query_id: cb.id }),
				tg("editMessageReplyMarkup", {
					chat_id: chatId,
					message_id: messageId,
					reply_markup: categoryKeyboard(entryId, cats, next),
				}),
			])
		}
		await Promise.all([
			tg("answerCallbackQuery", { callback_query_id: cb.id }),
			tg("editMessageReplyMarkup", {
				chat_id: chatId,
				message_id: messageId,
				reply_markup: { inline_keyboard: [] },
			}),
		])
		return advance(chatId, entryId.slice(DRAFT_ID_PREFIX.length), "categories")
	}
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
