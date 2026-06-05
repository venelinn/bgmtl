/**
 * Minimal signed Cloudinary upload + cloudinaryAsset shaping, shared by
 * attach-event-covers.js and add-fb-event.js.
 *
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */

const crypto = require("crypto")

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const CLOUD_KEY = process.env.CLOUDINARY_API_KEY
const CLOUD_SECRET = process.env.CLOUDINARY_API_SECRET

const hasCloudinaryCreds = () =>
	Boolean(CLOUD && CLOUD_KEY && CLOUD_SECRET)

/** Returns the name of the first missing Cloudinary env var, or null. */
const missingCloudinaryCred = () => {
	if (!CLOUD) return "CLOUDINARY_CLOUD_NAME"
	if (!CLOUD_KEY) return "CLOUDINARY_API_KEY"
	if (!CLOUD_SECRET) return "CLOUDINARY_API_SECRET"
	return null
}

const withTransform = (url) =>
	url.replace("/upload/", "/upload/f_auto/q_auto/")

/** Signed upload of a remote image (downloaded, then sent as multipart). */
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

module.exports = {
	hasCloudinaryCreds,
	missingCloudinaryCred,
	uploadToCloudinary,
	toCoverAsset,
}
