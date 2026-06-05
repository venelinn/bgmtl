/**
 * Shared helpers that turn a scraped + translated event into the Contentful
 * event/heading entry shape. Used by build-events-json.js (year batches) and
 * add-fb-event.js (single events).
 */

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

// Contentful caps entry ids at 64 chars. Ids look like `heading-<slug>-<suffix>`
// (prefix 8 + suffix e.g. "-2026-06-14" ~11), so keep the slug short enough that
// the longest id still fits.
const SLUG_MAX = 40

const slugify = (text) =>
	transliterate(text)
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX)
		.replace(/-+$/g, "") || "event"

// ---- rich text -------------------------------------------------------------

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

const localizedRichText = (byLocale, locales) => {
	const out = {}
	for (const locale of locales) {
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

/**
 * Build the `event` + linked `heading` entry objects (Contentful import shape).
 *
 * @param {Object} p
 * @param {Object} p.nameByLocale   localized display title
 * @param {Object|null} p.venueByLocale
 * @param {Object} p.descByLocale   localized description (rich text source)
 * @param {string} p.eventId
 * @param {string} p.headingId
 * @param {string} p.startISO       naive local datetime
 * @param {string|number} p.titleSuffix  appended to the admin title label
 * @param {string[]} p.locales
 * @param {Object} [p.source]       non-imported breadcrumb stored on the event
 */
const makeEventAndHeading = ({
	nameByLocale,
	venueByLocale,
	descByLocale,
	eventId,
	headingId,
	startISO,
	titleSuffix,
	locales,
	source,
}) => {
	const enName = nameByLocale["en-CA"] || Object.values(nameByLocale)[0] || ""

	const excerptByLocale = {}
	const adminTitle = {}
	for (const locale of locales) {
		excerptByLocale[locale] = firstSentence(descByLocale[locale])
		adminTitle[locale] = `Event: ${enName} ${titleSuffix}`
	}

	const eventFields = {
		title: adminTitle,
		heading: {
			"bg-BG": { sys: { type: "Link", linkType: "Entry", id: headingId } },
		},
		date: { "bg-BG": startISO },
		doorsOpen: { "bg-BG": startISO },
		content: localizedRichText(descByLocale, locales),
		excerpt: localizedRichText(excerptByLocale, locales),
	}
	if (venueByLocale) {
		eventFields.venue = venueByLocale
	}

	const event = { sys: { id: eventId, contentType: "event" }, fields: eventFields }
	if (source) {
		event._source = source
	}

	const heading = {
		sys: { id: headingId, contentType: "heading" },
		fields: {
			title: nameByLocale,
			heading: nameByLocale,
			as: { "bg-BG": "h2" },
			size: { "bg-BG": "h2" },
		},
	}

	return { event, heading }
}

module.exports = {
	transliterate,
	slugify,
	richTextDoc,
	localizedRichText,
	firstSentence,
	makeEventAndHeading,
}
