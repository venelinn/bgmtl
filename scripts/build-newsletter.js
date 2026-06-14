#!/usr/bin/env node

require("dotenv").config()

/**
 * Build a Brevo-ready HTML newsletter (Bulgarian) from Contentful.
 *
 * Reads published content straight from the Contentful Delivery API and renders
 * it with the shared renderer in scripts/lib/newsletter-render.js (the same one
 * the /api/newsletter webhook uses, so the email is identical either way).
 *
 * Usage:
 *   node scripts/build-newsletter.js                       # upcoming events (default)
 *   node scripts/build-newsletter.js --mode news
 *   node scripts/build-newsletter.js --mode eventsAndNews
 *   node scripts/build-newsletter.js --mode selectedEvents --events <id1>,<id2>
 *   node scripts/build-newsletter.js --entry <newsletterEntryId>   # read mode/intro/events from a CMS entry
 *   node scripts/build-newsletter.js --limit 6 --out path/to/file.html
 *   node scripts/build-newsletter.js --entry <id> --brevo-draft     # also create a Brevo DRAFT campaign
 *
 * Env (from .env):
 * - CONTENTFUL_SPACE_ID        (default: huajfyusfsch)
 * - CONTENTFUL_ENVIRONMENT     (default: master)
 * - CONTENTFUL_DELIVERY_TOKEN  (required)
 * - NEXT_PUBLIC_BASE_URL       (default: https://bgmtl.com)
 * - NEXT_PUBLIC_SITE_NAME      (default: bgmtl.com)
 * - BREVO_API_KEY / BREVO_LIST_ID / BREVO_SENDER_NAME / BREVO_SENDER_EMAIL  (only for --brevo-draft)
 */

const fs = require("fs")
const path = require("path")
const { createClient } = require("contentful")
const {
	renderNewsletter,
	formatDateBg,
	parseNaive,
	richTextToPlain,
	truncate,
	thumbUrl,
} = require("./lib/newsletter-render")

// ---- config ---------------------------------------------------------------

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const DELIVERY_TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN
const BASE_URL = (
	process.env.NEXT_PUBLIC_BASE_URL || "https://bgmtl.com"
).replace(/\/+$/, "")
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "bgmtl.com"
const LOCALE = "bg-BG"
const MODES = ["upcomingEvents", "selectedEvents", "news", "eventsAndNews"]

const argv = process.argv.slice(2)
const getArg = (name, fallback) => {
	const i = argv.indexOf(`--${name}`)
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}
const hasFlag = (name) => argv.includes(`--${name}`)

const LIMIT = Number(getArg("limit", "8"))
const OUT_PATH = path.resolve(
	getArg("out", path.join(__dirname, "output", "newsletter-bg.html")),
)
const ENTRY_ID = getArg("entry", null)
const EVENT_IDS = getArg("events", "")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean)
const MODE = getArg("mode", "upcomingEvents")
const BREVO_DRAFT = hasFlag("brevo-draft")

if (!DELIVERY_TOKEN) {
	console.error("❌ CONTENTFUL_DELIVERY_TOKEN is required (see .env)")
	process.exit(1)
}

// ---- slug (mirror of utils/common.ts so links match the live site) --------
// NOTE: keep this in sync with transliterateCyrillic/slugify in utils/common.ts.
// Differs from scripts/lib/events-format.js (ь→"" here, no 40-char id cap).

const CYRILLIC_MAP = {
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ж: "zh",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	х: "h",
	ц: "ts",
	ч: "ch",
	ш: "sh",
	щ: "sht",
	ъ: "a",
	ь: "",
	ю: "yu",
	я: "ya",
}

const slugify = (value) => {
	const latin = String(value)
		.toLowerCase()
		.split("")
		.map((ch) => CYRILLIC_MAP[ch] ?? ch)
		.join("")
	const slug = latin
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
	return slug || "event"
}

// ---- Contentful (Delivery API) --------------------------------------------

const client = createClient({
	space: SPACE_ID,
	environment: ENVIRONMENT,
	accessToken: DELIVERY_TOKEN,
	host: "cdn.contentful.com", // ignore CONTENTFUL_HOST (preview) for this read
})

function headingText(entry) {
	const h = entry.fields?.heading
	// Delivery API resolves the linked heading entry; its display text lives in
	// fields.heading. Fall back to the entry's admin title.
	if (h && typeof h === "object" && h.fields)
		return h.fields.heading || h.fields.title || ""
	if (typeof h === "string") return h
	return entry.fields?.title || ""
}

/** Map a resolved `event` entry → normalized newsletter item. */
function eventToItem(e) {
	const title = headingText(e)
	return {
		type: "event",
		title,
		when: formatDateBg(e.fields.date),
		ts: parseNaive(e.fields.date)?.date.getTime() ?? 0,
		venue: e.fields.venue || "",
		excerpt: truncate(richTextToPlain(e.fields.excerpt)),
		image: thumbUrl(
			e.fields.cover?.[0]?.secure_url || e.fields.cover?.[0]?.url,
		),
		url: `${BASE_URL}/events/${slugify(title || e.fields.venue || "event")}`,
	}
}

/** Map a resolved `news` entry → normalized newsletter item. */
function newsToItem(n) {
	const title = headingText(n)
	return {
		type: "news",
		title,
		when: formatDateBg(n.fields.date),
		excerpt: truncate(richTextToPlain(n.fields.excerpt)),
		image: thumbUrl(
			n.fields.cover?.[0]?.secure_url || n.fields.cover?.[0]?.url,
		),
		url: `${BASE_URL}/news/${slugify(title || "news")}`,
	}
}

async function fetchUpcomingEvents(limit = LIMIT) {
	const res = await client.getEntries({
		content_type: "event",
		locale: LOCALE,
		include: 2,
		limit: 200,
	})
	const startOfToday = new Date()
	startOfToday.setHours(0, 0, 0, 0)
	const cutoff = startOfToday.getTime()
	return res.items
		.map(eventToItem)
		.filter((e) => e.ts >= cutoff)
		.sort((a, b) => a.ts - b.ts)
		.slice(0, limit)
}

async function fetchSelectedEvents(ids) {
	if (!ids.length) return []
	const res = await client.getEntries({
		content_type: "event",
		locale: LOCALE,
		include: 2,
		"sys.id[in]": ids.join(","),
	})
	const byId = new Map(res.items.map((e) => [e.sys.id, eventToItem(e)]))
	return ids.map((id) => byId.get(id)).filter(Boolean) // preserve the chosen order
}

async function fetchNews(limit = LIMIT) {
	const res = await client.getEntries({
		content_type: "news",
		locale: LOCALE,
		include: 2,
		order: "-fields.date",
		limit,
	})
	return res.items.map(newsToItem)
}

/** Read a published `newsletter` entry → { mode, intro, subject, preheader, eventIds, max }. */
async function fetchNewsletterEntry(id) {
	const res = await client.getEntries({
		content_type: "newsletter",
		locale: LOCALE,
		"sys.id": id,
		include: 2,
		limit: 1,
	})
	const entry = res.items[0]
	if (!entry)
		throw new Error(`newsletter entry ${id} not found (is it published?)`)
	const f = entry.fields
	return {
		mode: f.contentMode || "upcomingEvents",
		intro: f.intro || undefined,
		subject: f.subject || undefined,
		preheader: f.preheader || undefined,
		eventIds: Array.isArray(f.events)
			? f.events.map((ev) => ev?.sys?.id).filter(Boolean)
			: [],
		max: Number(f.maxItems) || LIMIT,
	}
}

// ---- assemble sections per mode -------------------------------------------

async function collectSections({ mode, eventIds, max }) {
	const EVENTS_LABEL = "✨ Предстоящи събития"
	const NEWS_LABEL = "📰 Новини"
	switch (mode) {
		case "selectedEvents":
			return [
				{ label: EVENTS_LABEL, items: await fetchSelectedEvents(eventIds) },
			]
		case "news":
			return [{ label: NEWS_LABEL, items: await fetchNews(max) }]
		case "eventsAndNews":
			return [
				{ label: EVENTS_LABEL, items: await fetchUpcomingEvents(max) },
				{ label: NEWS_LABEL, items: await fetchNews(max) },
			]
		default:
			return [{ label: EVENTS_LABEL, items: await fetchUpcomingEvents(max) }]
	}
}

// ---- Brevo draft (optional, --brevo-draft) --------------------------------

async function createBrevoDraft({ name, subject, html }) {
	const KEY = process.env.BREVO_API_KEY
	const LIST_ID = process.env.BREVO_LIST_ID
	const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL
	const SENDER_NAME = process.env.BREVO_SENDER_NAME || SITE_NAME
	if (!KEY || !LIST_ID || !SENDER_EMAIL) {
		throw new Error(
			"Brevo draft needs BREVO_API_KEY, BREVO_LIST_ID and BREVO_SENDER_EMAIL in .env",
		)
	}
	const res = await fetch("https://api.brevo.com/v3/emailCampaigns", {
		method: "POST",
		headers: {
			"api-key": KEY,
			"Content-Type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({
			name,
			subject,
			sender: { name: SENDER_NAME, email: SENDER_EMAIL },
			htmlContent: html,
			recipients: { listIds: [Number(LIST_ID)] },
			// no scheduledAt → stays a DRAFT for manual review + send
		}),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) throw new Error(`Brevo ${res.status}: ${JSON.stringify(data)}`)
	return data.id
}

// ---- main -----------------------------------------------------------------

async function main() {
	let config = {
		mode: MODE,
		eventIds: EVENT_IDS,
		max: LIMIT,
		intro: undefined,
		subject: undefined,
		preheader: undefined,
	}

	if (ENTRY_ID) {
		const entry = await fetchNewsletterEntry(ENTRY_ID)
		config = {
			mode: entry.mode,
			eventIds: entry.eventIds,
			max: entry.max,
			intro: entry.intro,
			subject: entry.subject,
			preheader: entry.preheader,
		}
		console.log(
			`📄 entry ${ENTRY_ID}: mode=${config.mode}, events=${config.eventIds.length}, max=${config.max}`,
		)
	}

	if (!MODES.includes(config.mode)) {
		console.error(
			`❌ Unknown mode "${config.mode}". Use one of: ${MODES.join(", ")}`,
		)
		process.exit(1)
	}

	const sections = await collectSections(config)
	const total = sections.reduce((n, s) => n + s.items.length, 0)
	if (total === 0)
		console.warn(
			"⚠️  No items found for this mode — writing an empty template anyway.",
		)

	const subject = config.subject || "Бюлетин на общността"
	const html = renderNewsletter({
		siteName: SITE_NAME,
		baseUrl: BASE_URL,
		intro: config.intro,
		preheader: config.preheader,
		sections,
	})

	fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
	fs.writeFileSync(OUT_PATH, html, "utf8")
	console.log(`✅ ${total} item(s) [${config.mode}] → ${OUT_PATH}`)
	for (const s of sections)
		for (const it of s.items)
			console.log(`   • [${it.type}] ${it.when || ""} — ${it.title}`)

	if (BREVO_DRAFT) {
		const id = await createBrevoDraft({
			name: `${subject} — ${new Date().toISOString().slice(0, 10)}`,
			subject,
			html,
		})
		console.log(
			`📨 Brevo draft created (campaign id ${id}) — review & send in the Brevo dashboard.`,
		)
	}
}

main().catch((err) => {
	console.error("❌ Failed to build newsletter:", err)
	process.exit(1)
})
