#!/usr/bin/env node

require("dotenv").config()

/**
 * Scrape events from a public Facebook group's events tab into a raw JSON file.
 *
 * Facebook renders group events only for logged-in sessions, so this uses a
 * saved Playwright storage state (a cookie/localStorage snapshot). Create it
 * once with --login, then re-run headless as often as you like.
 *
 * Usage:
 *   node scripts/scrape-fb-events.js --login            # one-time: log in, save session
 *   node scripts/scrape-fb-events.js                    # scrape current year
 *   node scripts/scrape-fb-events.js --year 2026
 *   node scripts/scrape-fb-events.js --group <id> --year 2026 --headed --debug
 *   node scripts/scrape-fb-events.js --url https://www.facebook.com/groups/<id>/events
 *   node scripts/scrape-fb-events.js --tz America/Toronto
 *
 * Source selection (first match wins): --url > --group / FB_GROUP_ID > default group.
 * --url accepts a full group OR page events URL (numeric id or vanity name); a
 * bare group/page URL without /events has it appended automatically.
 *
 * Output: mockData/events/_scraped/<year>.raw.json
 *
 * Event links are collected only from the group listing's [role="main"] region
 * so the logged-in user's personal "Recommended / Your upcoming events" sidebar
 * doesn't leak in. Each event's detail page is then opened and its visible
 * content (title, venue address, description) parsed from [role="main"]; the
 * start time comes from the embedded epoch timestamp converted to local time.
 *
 * Facebook obfuscates and frequently changes its DOM, so parsing is heuristic.
 * Run with --debug to dump each event's main-region text + a screenshot to
 * _scraped/debug/ when something won't parse.
 */

const fs = require("fs")
const path = require("path")
const readline = require("readline")
const { chromium } = require("playwright")
const {
	sleep,
	buildEventsUrl,
	extractEvent,
} = require("./lib/fb-extract")

// ---- args ----------------------------------------------------------------

const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const getOpt = (name, fallback) => {
	const i = argv.indexOf(`--${name}`)
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}

const DEFAULT_GROUP_ID = "958440790893938" // Bulgarians in Montreal
const GROUP_ID = getOpt("group", process.env.FB_GROUP_ID || DEFAULT_GROUP_ID)
// Full events-listing URL (group or page, numeric id or vanity name). Takes
// precedence over --group. e.g. --url https://www.facebook.com/groups/<id>/events
const SOURCE_URL = getOpt("url", process.env.FB_EVENTS_URL || "")
const YEAR = Number.parseInt(getOpt("year", String(new Date().getFullYear())), 10)
const TIMEZONE = getOpt("tz", process.env.FB_EVENTS_TZ || "America/Toronto")
const LOGIN = hasFlag("login")
const HEADED = hasFlag("headed") || LOGIN
const DEBUG = hasFlag("debug")
const MAX_SCROLLS = Number.parseInt(getOpt("scrolls", "40"), 10)

const SESSION_PATH = path.join(__dirname, "../.fb-session.json")
const OUT_DIR = path.join(__dirname, "../mockData/events/_scraped")
const DEBUG_DIR = path.join(OUT_DIR, "debug")
const OUT_PATH = path.join(OUT_DIR, `${YEAR}.raw.json`)

// ---- helpers --------------------------------------------------------------

const log = (...args) => console.log(...args)

const waitForEnter = (question) =>
	new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		})
		rl.question(question, () => {
			rl.close()
			resolve()
		})
	})

// ---- login flow -----------------------------------------------------------

async function doLogin() {
	log("🔑 Opening a browser. Log into Facebook, then return here.")
	const browser = await chromium.launch({ headless: false })
	const context = await browser.newContext()
	const page = await context.newPage()
	await page.goto("https://www.facebook.com/login", {
		waitUntil: "domcontentloaded",
	})

	await waitForEnter(
		"\n👉 After you see your Facebook feed, press ENTER here to save the session... ",
	)

	fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true })
	await context.storageState({ path: SESSION_PATH })
	await browser.close()
	log(`✅ Session saved to ${path.relative(process.cwd(), SESSION_PATH)}`)
	log("   (gitignored — never commit this file)")
}

// ---- collecting event links (scoped to the group listing) -----------------

async function collectEventIds(page) {
	const seen = new Set()
	let lastCount = 0
	let stable = 0

	for (let i = 0; i < MAX_SCROLLS; i++) {
		const ids = await page.evaluate(() => {
			const root = document.querySelector('[role="main"]') || document.body
			return [...root.querySelectorAll('a[href*="/events/"]')]
				.map((a) => {
					const m = (a.getAttribute("href") || "").match(/\/events\/(\d+)/)
					return m ? m[1] : null
				})
				.filter(Boolean)
		})
		for (const id of ids) {
			seen.add(id)
		}

		if (seen.size === lastCount) {
			stable++
			if (stable >= 3) {
				break
			}
		} else {
			stable = 0
			lastCount = seen.size
		}

		await page.mouse.wheel(0, 4000)
		await sleep(1200)
	}

	return [...seen]
}

// ---- main -----------------------------------------------------------------

async function main() {
	if (LOGIN) {
		await doLogin()
		return
	}

	if (!fs.existsSync(SESSION_PATH)) {
		console.error(
			"❌ No saved session. Run once with --login first:\n   node scripts/scrape-fb-events.js --login",
		)
		process.exit(1)
	}

	const eventsUrl = buildEventsUrl({ url: SOURCE_URL, groupId: GROUP_ID })

	log("📋 Configuration:")
	log(`   Source:   ${eventsUrl}`)
	log(`   Year:     ${YEAR}`)
	log(`   Timezone: ${TIMEZONE}`)
	log(`   Output:   mockData/events/_scraped/${YEAR}.raw.json`)
	log(`   Mode:     ${HEADED ? "headed" : "headless"}${DEBUG ? " + debug" : ""}\n`)

	const browser = await chromium.launch({ headless: !HEADED })
	const context = await browser.newContext({
		storageState: SESSION_PATH,
		locale: "bg-BG",
		viewport: { width: 1280, height: 1600 },
	})
	const page = await context.newPage()

	log(`🌐 Loading ${eventsUrl}`)
	await page.goto(eventsUrl, { waitUntil: "domcontentloaded" })
	await sleep(2500)

	if (/login|log in/i.test(await page.title())) {
		console.error(
			"❌ Looks like the session expired or got logged out.\n   Re-run: node scripts/scrape-fb-events.js --login",
		)
		await browser.close()
		process.exit(1)
	}

	log("🔎 Scrolling the group events list…")
	const ids = await collectEventIds(page)
	log(`   Found ${ids.length} group event(s).`)

	const events = []
	for (let i = 0; i < ids.length; i++) {
		const id = ids[i]
		try {
			const ev = await extractEvent(page, id, {
				tz: TIMEZONE,
				debug: DEBUG,
				debugDir: DEBUG_DIR,
			})
			const evYear = ev.startISO
				? Number.parseInt(ev.startISO.slice(0, 4), 10)
				: null

			if (evYear !== null && evYear !== YEAR) {
				log(`   · [${i + 1}/${ids.length}] skip "${ev.name}" (${evYear})`)
				continue
			}
			events.push(ev)
			log(
				`   ✅ [${i + 1}/${ids.length}] ${ev.name}${ev.startISO ? ` — ${ev.startISO}` : " — ⚠️ no date"}`,
			)
		} catch (err) {
			log(`   ❌ [${i + 1}/${ids.length}] ${id}: ${err.message}`)
		}
	}

	await browser.close()

	events.sort((a, b) => (b.startISO || "").localeCompare(a.startISO || ""))

	const output = {
		source: eventsUrl,
		groupId: GROUP_ID,
		year: YEAR,
		timezone: TIMEZONE,
		scrapedAt: new Date().toISOString(),
		count: events.length,
		events,
	}

	fs.mkdirSync(OUT_DIR, { recursive: true })
	fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8")

	const noDate = events.filter((e) => e.needsReview).length
	log(`\n✨ Wrote ${events.length} event(s) to mockData/events/_scraped/${YEAR}.raw.json`)
	if (noDate > 0) {
		log(`⚠️  ${noDate} event(s) need a manual date check (needsReview: true).`)
	}
	log(`\nNext: node scripts/build-events-json.js ${YEAR}`)
}

main().catch((err) => {
	console.error("❌ Fatal error:", err)
	process.exit(1)
})
