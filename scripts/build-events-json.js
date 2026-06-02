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
const { slugify, makeEventAndHeading } = require("./lib/events-format")

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

		// Unique slug from the English title.
		const base = slugify(nameByLocale["en-CA"] || ev.name)
		let slug = base
		let suffix = 2
		while (usedSlugs.has(slug)) {
			slug = `${base}-${suffix++}`
		}
		usedSlugs.add(slug)

		const { event, heading } = makeEventAndHeading({
			nameByLocale,
			venueByLocale,
			descByLocale,
			eventId: `event-${slug}-${year}`,
			headingId: `heading-${slug}-${year}`,
			startISO: ev.startISO || `${year}-01-01T19:00:00`,
			titleSuffix: year,
			locales: LOCALES,
			source: { fbEventId: ev.fbEventId, url: ev.url, needsReview: ev.needsReview },
		})

		events.push(event)
		headings.push(heading)
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
