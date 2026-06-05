#!/usr/bin/env node

require("dotenv").config()

/**
 * Upload scraped Facebook cover images to Cloudinary and attach them to the
 * matching Contentful event entries.
 *
 * Pairs each event in mockData/events/events_<year>.json with its scraped cover
 * URL in mockData/events/_scraped/<year>.raw.json (matched by Facebook event
 * id), uploads that image to Cloudinary (signed), and writes the result into
 * the event's `cover` field in the same cloudinaryAsset shape the Contentful
 * Cloudinary app uses — then publishes.
 *
 * Events that already have a cover are skipped, so manual covers are never
 * overwritten. Facebook image URLs are signed and expire within days, so run
 * this soon after scraping.
 *
 * Usage: node scripts/attach-event-covers.js <year>
 *
 * Env (.env):
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (required)
 *   CONTENTFUL_MANAGEMENT_TOKEN (required), CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT
 */

const fs = require("fs")
const path = require("path")
const { createClient } = require("contentful-management")
const {
	uploadToCloudinary,
	toCoverAsset,
	missingCloudinaryCred,
} = require("./lib/cloudinary")

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN
const LOCALES = ["bg-BG", "en-CA", "fr-CA"]

// Override the Contentful entry id for specific Facebook events whose imported
// id differs from the build-generated one (e.g. Bocelli got a shortened id).
const ID_OVERRIDES = {
	"2421817428272591": "event-andrea-bocelli-2026",
}

const year = Number.parseInt(process.argv[2] || "", 10)
if (!Number.isInteger(year)) {
	console.error("❌ Usage: node scripts/attach-event-covers.js <year>")
	process.exit(1)
}

const missingCred = !MANAGEMENT_TOKEN
	? "CONTENTFUL_MANAGEMENT_TOKEN"
	: missingCloudinaryCred()
if (missingCred) {
	console.error(`❌ Missing ${missingCred} in .env`)
	process.exit(1)
}

const RAW_PATH = path.join(__dirname, "../mockData/events/_scraped", `${year}.raw.json`)
const EVENTS_PATH = path.join(__dirname, "../mockData/events", `events_${year}.json`)

// ---- main -----------------------------------------------------------------

const hasCover = (fields) =>
	fields?.cover &&
	Object.values(fields.cover).some((v) => Array.isArray(v) && v.length > 0)

async function main() {
	if (!fs.existsSync(RAW_PATH) || !fs.existsSync(EVENTS_PATH)) {
		console.error(
			`❌ Need both mockData/events/_scraped/${year}.raw.json and mockData/events/events_${year}.json`,
		)
		process.exit(1)
	}

	const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"))
	const events = JSON.parse(fs.readFileSync(EVENTS_PATH, "utf8"))
	const coverByFbId = new Map(
		(raw.events || []).map((e) => [e.fbEventId, e.coverUrl]),
	)

	const client = createClient({ accessToken: MANAGEMENT_TOKEN }, { type: "legacy" })
	const space = await client.getSpace(SPACE_ID)
	const env = await space.getEnvironment(ENVIRONMENT)

	console.log(`📋 Cloud: ${CLOUD} | Space: ${SPACE_ID}/${ENVIRONMENT}\n`)

	let done = 0
	let skipped = 0
	let failed = 0

	for (const item of events.events?.items || []) {
		const fbId = item._source?.fbEventId
		const coverUrl = fbId ? coverByFbId.get(fbId) : null
		const entryId = ID_OVERRIDES[fbId] || item.sys.id
		const label = item.sys.id

		if (!coverUrl) {
			console.log(`· skip ${label} (no scraped cover)`)
			skipped++
			continue
		}

		let entry
		try {
			entry = await env.getEntry(entryId)
		} catch {
			console.log(`⚠️  skip ${label} (entry not found: ${entryId})`)
			skipped++
			continue
		}

		if (hasCover(entry.fields)) {
			console.log(`· skip ${entryId} (already has a cover)`)
			skipped++
			continue
		}

		try {
			const up = await uploadToCloudinary(coverUrl)
			const asset = toCoverAsset(up)
			entry.fields.cover = Object.fromEntries(LOCALES.map((l) => [l, [asset]]))
			entry = await entry.update()
			await entry.publish()
			console.log(`✅ ${entryId} ← ${up.public_id} (${up.width}×${up.height})`)
			done++
		} catch (err) {
			console.log(`❌ ${entryId}: ${err.message}`)
			failed++
		}
	}

	console.log(`\n✨ Covers attached: ✅ ${done}  · skipped ${skipped}  ❌ ${failed}`)
	process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
	console.error("❌ Fatal error:", err.message)
	process.exit(1)
})
