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
const crypto = require("crypto")
const { createClient } = require("contentful-management")

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET
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

for (const [name, val] of [
	["CONTENTFUL_MANAGEMENT_TOKEN", MANAGEMENT_TOKEN],
	["CLOUDINARY_CLOUD_NAME", CLOUD],
	["CLOUDINARY_API_KEY", CLOUD_KEY],
	["CLOUDINARY_API_SECRET", CLOUD_SECRET],
]) {
	if (!val) {
		console.error(`❌ Missing ${name} in .env`)
		process.exit(1)
	}
}

const RAW_PATH = path.join(__dirname, "../mockData/events/_scraped", `${year}.raw.json`)
const EVENTS_PATH = path.join(__dirname, "../mockData/events", `events_${year}.json`)

// ---- cloudinary -----------------------------------------------------------

const withTransform = (url) => url.replace("/upload/", "/upload/f_auto/q_auto/")

/** Signed upload of a remote image (downloaded then sent as multipart). */
async function uploadToCloudinary(imageUrl) {
	const imgRes = await fetch(imageUrl)
	if (!imgRes.ok) {
		throw new Error(`fetch image ${imgRes.status}`)
	}
	const bytes = Buffer.from(await imgRes.arrayBuffer())

	const timestamp = Math.floor(Date.now() / 1000)
	const signature = crypto
		.createHash("sha1")
		.update(`timestamp=${timestamp}${CLOUD_SECRET}`)
		.digest("hex")

	const form = new FormData()
	form.set("file", new Blob([bytes]), "cover.jpg")
	form.set("api_key", CLOUD_KEY)
	form.set("timestamp", String(timestamp))
	form.set("signature", signature)

	const res = await fetch(
		`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
		{ method: "POST", body: form },
	)
	const data = await res.json()
	if (!res.ok) {
		throw new Error(`Cloudinary ${res.status}: ${JSON.stringify(data)}`)
	}
	return data
}

/** Shape a Cloudinary upload response like the Contentful Cloudinary app does. */
const toCoverAsset = (up) => ({
	url: withTransform(up.url),
	tags: [],
	type: up.type,
	bytes: up.bytes,
	width: up.width,
	format: up.format,
	height: up.height,
	version: up.version,
	duration: null,
	metadata: {},
	public_id: up.public_id,
	created_at: up.created_at,
	secure_url: withTransform(up.secure_url),
	original_url: up.url,
	resource_type: up.resource_type,
	raw_transformation: "f_auto/q_auto",
	original_secure_url: up.secure_url,
	original_transformed_url: withTransform(up.url),
})

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
