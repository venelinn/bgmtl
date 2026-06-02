#!/usr/bin/env node

require("dotenv").config()

/**
 * Add a SINGLE Facebook event to Contentful from its URL, end to end:
 * scrape → translate (bg-BG / en-CA / fr-CA) → create event + heading →
 * upload + attach the cover → publish.
 *
 * IDs are date-stamped (event-<slug>-<YYYY-MM-DD>) so recurring events that
 * share a title don't collide. Refuses to overwrite an event id that already
 * exists.
 *
 * Usage:
 *   node scripts/add-fb-event.js <eventUrlOrId>
 *   node scripts/add-fb-event.js https://www.facebook.com/events/1605426171589137/
 *   node scripts/add-fb-event.js <url> --dry          # scrape+translate, print, no writes
 *   node scripts/add-fb-event.js <url> --no-cover     # skip the cover upload
 *   node scripts/add-fb-event.js <url> --tz America/Toronto --headed --debug
 *
 * Env (.env): CONTENTFUL_MANAGEMENT_TOKEN (+ SPACE_ID/ENVIRONMENT), DEEPL_API_KEY,
 * and CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET (for the cover).
 */

const path = require("path")
const { chromium } = require("playwright")
const { createClient } = require("contentful-management")
const { extractEvent, parseEventId } = require("./lib/fb-extract")
const { localize, hasKey } = require("./lib/deepl")
const { slugify, makeEventAndHeading } = require("./lib/events-format")
const {
	uploadToCloudinary,
	toCoverAsset,
	hasCloudinaryCreds,
} = require("./lib/cloudinary")

const LOCALES = ["bg-BG", "en-CA", "fr-CA"]
const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN

const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const getOpt = (name, fallback) => {
	const i = argv.indexOf(`--${name}`)
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}

const VALUE_FLAGS = ["url", "id", "tz"]
const firstPositional = () => {
	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith("--")) {
			continue
		}
		const prev = argv[i - 1]
		if (prev?.startsWith("--") && VALUE_FLAGS.includes(prev.slice(2))) {
			continue
		}
		return argv[i]
	}
	return ""
}

const INPUT = getOpt("url", getOpt("id", firstPositional()))
const TIMEZONE = getOpt("tz", process.env.FB_EVENTS_TZ || "America/Toronto")
const HEADED = hasFlag("headed")
const DEBUG = hasFlag("debug")
const DRY = hasFlag("dry")
const NO_COVER = hasFlag("no-cover")

const SESSION_PATH = path.join(__dirname, "../.fb-session.json")
const DEBUG_DIR = path.join(__dirname, "../mockData/events/_scraped/debug")

async function scrape(id) {
	const browser = await chromium.launch({ headless: !HEADED })
	const context = await browser.newContext({
		storageState: SESSION_PATH,
		locale: "bg-BG",
		viewport: { width: 1280, height: 1600 },
	})
	const page = await context.newPage()
	try {
		return await extractEvent(page, id, {
			tz: TIMEZONE,
			debug: DEBUG,
			debugDir: DEBUG_DIR,
		})
	} finally {
		await browser.close()
	}
}

async function main() {
	const id = parseEventId(INPUT)
	if (!id) {
		console.error(
			"❌ Provide a Facebook event URL or id.\n   e.g. node scripts/add-fb-event.js https://www.facebook.com/events/1605426171589137/",
		)
		process.exit(1)
	}
	if (!require("fs").existsSync(SESSION_PATH)) {
		console.error("❌ No saved session. Run: node scripts/scrape-fb-events.js --login")
		process.exit(1)
	}
	if (!DRY) {
		if (!MANAGEMENT_TOKEN) {
			console.error("❌ Missing CONTENTFUL_MANAGEMENT_TOKEN in .env")
			process.exit(1)
		}
		if (!NO_COVER && !hasCloudinaryCreds()) {
			console.error(
				"❌ Cloudinary creds missing — add them to .env or pass --no-cover",
			)
			process.exit(1)
		}
	}

	// 1. Scrape
	console.log(`🌐 Scraping event ${id}…`)
	const ev = await scrape(id)
	if (/login|log in/i.test(ev.name)) {
		console.error("❌ Got a login page — session expired. Re-run --login.")
		process.exit(1)
	}
	if (!ev.startISO) {
		console.error("❌ Could not parse the event's start date; aborting.")
		process.exit(1)
	}
	console.log(`   ${ev.name} — ${ev.startISO}`)
	console.log(`   venue: ${ev.location || "—"} | cover: ${ev.coverUrl ? "yes" : "no"}`)

	// 2. Translate
	if (!hasKey()) {
		console.warn("⚠️  DEEPL_API_KEY not set — text stays in the source language.")
	}
	console.log("🌍 Translating…")
	const nameByLocale = await localize(ev.name, LOCALES)
	const venueByLocale = ev.location ? await localize(ev.location, LOCALES) : null
	const descByLocale = await localize(ev.description || "", LOCALES)

	// 3. Date-stamped ids
	const date = ev.startISO.slice(0, 10) // YYYY-MM-DD
	const year = date.slice(0, 4)
	const slug = slugify(nameByLocale["en-CA"] || ev.name)
	const eventId = `event-${slug}-${date}`
	const headingId = `heading-${slug}-${date}`

	const { event, heading } = makeEventAndHeading({
		nameByLocale,
		venueByLocale,
		descByLocale,
		eventId,
		headingId,
		startISO: ev.startISO,
		titleSuffix: year,
		locales: LOCALES,
		source: { fbEventId: ev.fbEventId, url: ev.url },
	})

	if (DRY) {
		console.log(`\n🧪 Dry run — would create:\n   event:   ${eventId}\n   heading: ${headingId}`)
		console.log(JSON.stringify({ event, heading }, null, 2))
		return
	}

	// 4. Contentful
	const client = createClient({ accessToken: MANAGEMENT_TOKEN }, { type: "legacy" })
	const space = await client.getSpace(SPACE_ID)
	const env = await space.getEnvironment(ENVIRONMENT)
	console.log(`\n📍 ${SPACE_ID}/${ENVIRONMENT}`)

	// refuse to overwrite an existing event
	try {
		await env.getEntry(eventId)
		console.error(`❌ Event already exists: ${eventId} (nothing changed).`)
		process.exit(1)
	} catch {
		/* not found — good, continue */
	}

	// 5. Cover → attach to the event fields before publishing
	if (!NO_COVER && ev.coverUrl) {
		try {
			console.log("🖼️  Uploading cover to Cloudinary…")
			const up = await uploadToCloudinary(ev.coverUrl)
			const asset = toCoverAsset(up)
			event.fields.cover = Object.fromEntries(LOCALES.map((l) => [l, [asset]]))
			console.log(`   ✅ ${up.public_id} (${up.width}×${up.height})`)
		} catch (err) {
			console.warn(`   ⚠️  cover upload failed (${err.message}); creating without it`)
		}
	}

	// 6. Heading (reuse if it somehow exists), then event; publish both
	let headingEntry
	try {
		headingEntry = await env.getEntry(headingId)
		console.log(`· heading exists, reusing: ${headingId}`)
	} catch {
		headingEntry = await env.createEntryWithId("heading", headingId, {
			fields: heading.fields,
		})
		await headingEntry.publish()
		console.log(`✅ heading created: ${headingId}`)
	}

	const eventEntry = await env.createEntryWithId("event", eventId, {
		fields: event.fields,
	})
	await eventEntry.publish()
	console.log(`✅ event created & published: ${eventId}`)
	console.log(`\n✨ Done — "${nameByLocale["en-CA"]}" added for ${date}.`)
}

main().catch((err) => {
	console.error("❌ Fatal error:", err.message || err)
	process.exit(1)
})
