#!/usr/bin/env node

require("dotenv").config()

/**
 * Turn scraped raw events into a Contentful import file.
 *
 * Reads:  mockData/events/_scraped/<year>.raw.json     (from scrape-fb-events.js)
 * Writes: mockData/events/events_<year>.json           (same shape as events_2025.json)
 *
 * Each raw event becomes one `event` entry + one linked `heading` entry, with
 * title / venue / excerpt / content localized into bg-BG, en-CA and fr-CA via
 * DeepL (set DEEPL_API_KEY in .env; without it, values are left in the source
 * language so you can translate them by hand).
 *
 * Usage: node scripts/build-events-json.js <year>
 *   e.g. node scripts/build-events-json.js 2026
 */

const fs = require("fs")
const path = require("path")
const { localize, hasKey } = require("./lib/deepl")

const LOCALES = ["bg-BG", "en-CA", "fr-CA"]

const year = Number.parseInt(process.argv[2] || "", 10)
if (!Number.isInteger(year)) {
	console.error("❌ Usage: node scripts/build-events-json.js <year>  (e.g. 2026)")
	process.exit(1)
}

const RAW_PATH = path.join(__dirname, "../mockData/events/_scraped", `${year}.raw.json`)
const OUT_PATH = path.join(__dirname, "../mockData/events", `events_${year}.json`)

if (!fs.existsSync(RAW_PATH)) {
	console.error(
		`❌ No scraped data at mockData/events/_scraped/${year}.raw.json\n   Run: node scripts/scrape-fb-events.js --year ${year}`,
	)
	process.exit(1)
}

// ---- slug + transliteration ----------------------------------------------

const CYRILLIC_MAP = {
	а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
	й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
	т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht",
	ъ: "a", ь: "y", ю: "yu", я: "ya",
}

const transliterate = (text) =>
	String(text)
		.toLowerCase()
		.split("")
		.map((ch) => CYRILLIC_MAP[ch] ?? ch)
		.join("")

// Contentful caps entry ids at 64 chars. Ids are `heading-<slug>-<year>`
// (prefix 8 + "-2026" 5 + a possible "-N" dedupe suffix), so keep the slug
// short enough that the longest id still fits.
const SLUG_MAX = 45

const slugify = (text) =>
	transliterate(text)
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX)
		.replace(/-+$/g, "") || "event"

// ---- rich text helpers ----------------------------------------------------

const richTextDoc = (text) => {
	const paragraphs = String(text || "")
		.split(/\n+/)
		.map((p) => p.trim())
		.filter(Boolean)

	return {
		nodeType: "document",
		data: {},
		content: paragraphs.map((p) => ({
			nodeType: "paragraph",
			data: {},
			content: [{ nodeType: "text", value: p, marks: [], data: {} }],
		})),
	}
}

const localizedRichText = (byLocale) => {
	const out = {}
	for (const locale of LOCALES) {
		out[locale] = richTextDoc(byLocale[locale])
	}
	return out
}

const firstSentence = (text) => {
	const clean = String(text || "").replace(/\s+/g, " ").trim()
	if (clean.length <= 180) {
		return clean
	}
	const cut = clean.slice(0, 180)
	const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "))
	return `${(lastStop > 60 ? cut.slice(0, lastStop + 1) : cut).trim()}…`
}

// ---- build ----------------------------------------------------------------

async function build() {
	const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"))
	const rawEvents = raw?.events || []

	if (!hasKey()) {
		console.warn(
			"⚠️  DEEPL_API_KEY not set — values stay in the source language. Add it to .env for auto-translation.\n",
		)
	}

	const events = []
	const headings = []
	const usedSlugs = new Set()

	for (let i = 0; i < rawEvents.length; i++) {
		const ev = rawEvents[i]

		console.log(`🌍 [${i + 1}/${rawEvents.length}] ${ev.name}`)

		// Translate the three localizable text fields (source auto-detected).
		const nameByLocale = await localize(ev.name, LOCALES)
		const venueByLocale = ev.location
			? await localize(ev.location, LOCALES)
			: null
		const descByLocale = await localize(ev.description || "", LOCALES)
		const excerptByLocale = {}
		for (const locale of LOCALES) {
			excerptByLocale[locale] = firstSentence(descByLocale[locale])
		}

		// Unique slug from the English title.
		let slug = slugify(nameByLocale["en-CA"] || ev.name)
		let suffix = 2
		while (usedSlugs.has(slug)) {
			slug = `${slugify(nameByLocale["en-CA"] || ev.name)}-${suffix++}`
		}
		usedSlugs.add(slug)

		const headingId = `heading-${slug}-${year}`
		const eventId = `event-${slug}-${year}`
		const startISO = ev.startISO || `${year}-01-01T19:00:00`

		// Title field is an admin label, same value across locales.
		const adminTitle = {}
		for (const locale of LOCALES) {
			adminTitle[locale] = `Event: ${nameByLocale["en-CA"] || ev.name} ${year}`
		}

		const eventFields = {
			title: adminTitle,
			heading: {
				"bg-BG": {
					sys: { type: "Link", linkType: "Entry", id: headingId },
				},
			},
			date: { "bg-BG": startISO },
			doorsOpen: { "bg-BG": startISO },
			content: localizedRichText(descByLocale),
			excerpt: localizedRichText(excerptByLocale),
		}
		if (venueByLocale) {
			eventFields.venue = venueByLocale
		}

		events.push({
			sys: { id: eventId, contentType: "event" },
			fields: eventFields,
			// non-imported breadcrumb back to the source post
			_source: { fbEventId: ev.fbEventId, url: ev.url, needsReview: ev.needsReview },
		})

		headings.push({
			sys: { id: headingId, contentType: "heading" },
			fields: {
				title: nameByLocale,
				heading: nameByLocale,
				as: { "bg-BG": "h2" },
				size: { "bg-BG": "h2" },
			},
		})
	}

	const output = {
		events: { total: events.length, items: events },
		headings: { total: headings.length, items: headings },
	}

	fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8")

	const review = events.filter((e) => e._source?.needsReview).length
	console.log(`\n✨ Wrote ${events.length} event(s) to mockData/events/events_${year}.json`)
	if (review > 0) {
		console.log(
			`⚠️  ${review} event(s) have needsReview — check their date/doorsOpen before importing.`,
		)
	}
	console.log(`\nNext: node scripts/import-events.js events_${year}`)
}

build().catch((err) => {
	console.error("❌ Fatal error:", err)
	process.exit(1)
})
