/**
 * Thin DeepL translation helper used by build-events-json.js.
 *
 * Requires DEEPL_API_KEY in .env. Free-tier keys end in ":fx" and use the
 * api-free.deepl.com host; everything else uses the pro host.
 *
 * App locales map to DeepL language codes like so:
 *   bg-BG -> BG          en-CA -> EN-US (src EN)        fr-CA -> FR
 * DeepL has no Canadian variants, so en-CA/fr-CA fall back to EN-US/FR.
 */

const fs = require("fs")
const path = require("path")

const DEEPL_KEY = process.env.DEEPL_API_KEY
const IS_FREE = Boolean(DEEPL_KEY?.endsWith(":fx"))
const ENDPOINT = IS_FREE
	? "https://api-free.deepl.com/v2/translate"
	: "https://api.deepl.com/v2/translate"

// Locale -> DeepL target code (what we translate INTO)
const TARGET_BY_LOCALE = {
	"bg-BG": "BG",
	"en-CA": "EN-US",
	"fr-CA": "FR",
}

// DeepL detected-source code -> our locale (so we can keep the original text
// verbatim for whichever language the field is already in).
const LOCALE_BY_DEEPL = {
	BG: "bg-BG",
	EN: "en-CA",
	FR: "fr-CA",
}

// Persisted cache so re-runs don't burn the monthly character quota.
const CACHE_PATH = path.join(
	__dirname,
	"../../mockData/events/_scraped/.translation-cache.json",
)

let cache = null

const loadCache = () => {
	if (cache) {
		return cache
	}
	try {
		cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"))
	} catch {
		cache = {}
	}
	return cache
}

const saveCache = () => {
	if (!cache) {
		return
	}
	fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
	fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

const hasKey = () => Boolean(DEEPL_KEY)

/**
 * Translate `text` from `sourceLocale` into `targetLocale` (both app locales,
 * e.g. "bg-BG"). Returns the original text unchanged when empty, when source
 * and target match, or when no API key is configured.
 */
const translate = async (text, targetLocale) => {
	if (!text || !text.trim() || !hasKey()) {
		return { text, detected: null }
	}

	const targetLang = TARGET_BY_LOCALE[targetLocale]
	if (!targetLang) {
		throw new Error(`Unsupported target locale: ${targetLocale}`)
	}

	// Source language is auto-detected per call so mixed-language events (e.g.
	// a French title with an English body) translate each field correctly.
	const store = loadCache()
	const cacheKey = `auto:${targetLang}:${text}`
	if (store[cacheKey]) {
		return store[cacheKey]
	}

	const params = new URLSearchParams()
	params.append("text", text)
	params.append("target_lang", targetLang)

	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params,
	})

	if (!res.ok) {
		const body = await res.text().catch(() => "")
		throw new Error(`DeepL ${res.status} ${res.statusText}: ${body}`)
	}

	const data = await res.json()
	const result = {
		text: data?.translations?.[0]?.text ?? text,
		detected: data?.translations?.[0]?.detected_source_language ?? null,
	}

	store[cacheKey] = result
	saveCache()

	return result
}

/**
 * Build a { "bg-BG": ..., "en-CA": ..., "fr-CA": ... } object for `text`.
 * DeepL detects the source language; the field is kept verbatim for whichever
 * of our locales matches that language, and translated into the others.
 */
const localize = async (text, targetLocales) => {
	if (!text || !text.trim() || !hasKey()) {
		return Object.fromEntries(targetLocales.map((l) => [l, text]))
	}

	const out = {}
	let sourceLocale = null
	for (const locale of targetLocales) {
		const { text: translated, detected } = await translate(text, locale)
		out[locale] = translated
		if (!sourceLocale && detected) {
			sourceLocale = LOCALE_BY_DEEPL[detected] || null
		}
	}

	// Prefer the untouched original over a same-language round-trip.
	if (sourceLocale && Object.hasOwn(out, sourceLocale)) {
		out[sourceLocale] = text
	}

	return out
}

module.exports = { translate, localize, hasKey, TARGET_BY_LOCALE }
