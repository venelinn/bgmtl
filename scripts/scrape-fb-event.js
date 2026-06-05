#!/usr/bin/env node

require("dotenv").config()

/**
 * Scrape a SINGLE Facebook event into a raw JSON record (and print it).
 *
 * Uses the same saved session and extraction logic as scrape-fb-events.js
 * (see scripts/lib/fb-extract.js). Create the session once with:
 *   node scripts/scrape-fb-events.js --login
 *
 * Usage:
 *   node scripts/scrape-fb-event.js <eventUrlOrId>
 *   node scripts/scrape-fb-event.js https://www.facebook.com/events/1534058694748503/
 *   node scripts/scrape-fb-event.js 1534058694748503 --tz America/Toronto --headed --debug
 *   node scripts/scrape-fb-event.js --url <eventUrl> --out mockData/events/_scraped/my-event.raw.json
 *
 * Output: mockData/events/_scraped/event-<id>.raw.json (envelope shape matches
 * the year files, so it can feed build-events-json.js if renamed/merged).
 */

const fs = require("fs")
const path = require("path")
const { chromium } = require("playwright")
const { extractEvent, parseEventId } = require("./lib/fb-extract")

const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const getOpt = (name, fallback) => {
	const i = argv.indexOf(`--${name}`)
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}

// First bare (non-flag, non-flag-value) token is the event url/id.
const VALUE_FLAGS = ["url", "id", "tz", "out"]
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

const SESSION_PATH = path.join(__dirname, "../.fb-session.json")
const OUT_DIR = path.join(__dirname, "../mockData/events/_scraped")
const DEBUG_DIR = path.join(OUT_DIR, "debug")

async function main() {
	const id = parseEventId(INPUT)
	if (!id) {
		console.error(
			"❌ Provide a Facebook event URL or id.\n   e.g. node scripts/scrape-fb-event.js https://www.facebook.com/events/1534058694748503/",
		)
		process.exit(1)
	}

	if (!fs.existsSync(SESSION_PATH)) {
		console.error(
			"❌ No saved session. Create one first:\n   node scripts/scrape-fb-events.js --login",
		)
		process.exit(1)
	}

	const outPath =
		getOpt("out", null) || path.join(OUT_DIR, `event-${id}.raw.json`)

	console.log(`🌐 Event ${id} | tz ${TIMEZONE} | ${HEADED ? "headed" : "headless"}`)

	const browser = await chromium.launch({ headless: !HEADED })
	const context = await browser.newContext({
		storageState: SESSION_PATH,
		locale: "bg-BG",
		viewport: { width: 1280, height: 1600 },
	})
	const page = await context.newPage()

	let ev
	try {
		ev = await extractEvent(page, id, {
			tz: TIMEZONE,
			debug: DEBUG,
			debugDir: DEBUG_DIR,
		})
	} finally {
		await browser.close()
	}

	if (/login|log in/i.test(ev.name)) {
		console.error(
			"❌ Got a login page — the session likely expired.\n   Re-run: node scripts/scrape-fb-events.js --login",
		)
		process.exit(1)
	}

	const output = {
		source: ev.url,
		scrapedAt: new Date().toISOString(),
		timezone: TIMEZONE,
		count: 1,
		events: [ev],
	}

	fs.mkdirSync(OUT_DIR, { recursive: true })
	fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8")

	console.log(`\n${JSON.stringify(ev, null, 2)}`)
	console.log(`\n✅ ${ev.name}${ev.startISO ? ` — ${ev.startISO}` : " — ⚠️ no date"}`)
	console.log(`   cover: ${ev.coverUrl ? "yes" : "no"} | venue: ${ev.location || "—"}`)
	console.log(`   saved → ${path.relative(process.cwd(), outPath)}`)
}

main().catch((err) => {
	console.error("❌ Fatal error:", err)
	process.exit(1)
})
