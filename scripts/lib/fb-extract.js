/**
 * Shared Facebook event extraction used by both the group scraper
 * (scrape-fb-events.js) and the single-event scraper (scrape-fb-event.js).
 *
 * The DOM parsing is heuristic — Facebook obfuscates and changes its markup —
 * so it leans on several fallbacks and always records the raw start timestamp.
 */

const fs = require("fs")
const path = require("path")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Convert an epoch (ms, UTC) to a naive local wall-clock ISO string in `tz`,
// e.g. 1797210000000 -> "2026-12-13T20:00:00" for America/Toronto. The import
// files store naive datetimes, so we deliberately drop the offset.
const epochToLocalISO = (ms, tz) => {
	const parts = new Intl.DateTimeFormat("sv-SE", {
		timeZone: tz,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(new Date(ms))
	const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
	return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`
}

const cleanName = (docTitle) =>
	String(docTitle || "")
		.replace(/^\(\d+\)\s*/, "") // strip unread-notification badge "(2) "
		.replace(/\s*\|\s*Facebook\s*$/i, "")
		.trim()

// Drop Facebook/UTM tracking params that get appended to resolved links.
const cleanUrl = (href) => {
	try {
		const url = new URL(href)
		for (const key of [...url.searchParams.keys()]) {
			if (/^(fbclid|utm_|mibextid|_)/i.test(key)) {
				url.searchParams.delete(key)
			}
		}
		return url.toString().replace(/\?$/, "")
	} catch {
		return href
	}
}

// Pull venue + description out of the detail page's main-region text.
const ADDRESS_HINT = /(montr[eé]al|qc|québec|quebec|canada|\bH\d[A-Z]\b)/i
const DESC_END = /^(guests|гости|going|interested|see all|meet your host|view all|going ·|interested ·|\d+ going|\d+ interested)$/i
const SEE_MORE = /\s*(see less|see more|виж по-малко|виж повече|voir moins|voir plus)\s*$/i

const parseMainText = (mainText) => {
	const lines = String(mainText || "")
		.split("\n")
		.map((l) => l.trim())

	// venue: first address-like line (has a comma and a Montreal/QC/postal hint)
	let venue = null
	for (const line of lines.slice(0, 30)) {
		if (line.includes(",") && /\d/.test(line) && ADDRESS_HINT.test(line)) {
			venue = line
			break
		}
	}

	// description: text after the privacy line, until a "See more/less" or a
	// trailing section heading (Guests / Going / ...).
	let start = -1
	for (let i = 0; i < Math.min(lines.length, 50); i++) {
		if (/anyone on or off facebook|на или извън facebook/i.test(lines[i])) {
			start = i + 1
		}
	}
	if (start === -1) {
		for (let i = 0; i < Math.min(lines.length, 50); i++) {
			if (/^(public|публично|private|частно)$/i.test(lines[i])) {
				start = i + 1
				break
			}
		}
	}

	const descLines = []
	if (start !== -1) {
		for (let i = start; i < lines.length; i++) {
			const line = lines[i]
			if (SEE_MORE.test(line)) {
				const prefix = line.replace(SEE_MORE, "").trim()
				if (prefix) {
					descLines.push(prefix)
				}
				break
			}
			if (DESC_END.test(line)) {
				break
			}
			descLines.push(line)
		}
	}

	const description = descLines
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim()

	return { venue, description }
}

/** Extract a Facebook event id from a raw id or any event URL. */
const parseEventId = (input) => {
	const s = String(input || "").trim()
	const m = s.match(/\/events\/(\d+)/) || s.match(/^(\d{6,})$/)
	return m ? m[1] : null
}

/**
 * Build the events-listing URL for the group scraper. Accepts a full
 * group/page URL (numeric id or vanity name) or a bare group id.
 */
const buildEventsUrl = ({ url, groupId }) => {
	if (url) {
		let u = url.trim()
		if (!/^https?:\/\//i.test(u)) {
			u = `https://${u}`
		}
		if (!/\/events\/?(\?|$)/i.test(u) && !/upcoming_events/i.test(u)) {
			u = `${u.replace(/\/+$/, "")}/events`
		}
		return u
	}
	return `https://www.facebook.com/groups/${groupId}/events`
}

/**
 * Scrape a single event detail page into a normalized record.
 *
 * @param {import('playwright').Page} page
 * @param {string} id   Facebook event id
 * @param {{ tz?: string, debug?: boolean, debugDir?: string }} [opts]
 */
async function extractEvent(page, id, opts = {}) {
	const tz = opts.tz || "America/Toronto"
	const url = `https://www.facebook.com/events/${id}/`
	await page.goto(url, { waitUntil: "domcontentloaded" })
	await sleep(2500)

	// Expand any truncated description ("See more" / localized variants).
	await page
		.evaluate(() => {
			for (const el of document.querySelectorAll(
				'div[role="button"], span, a',
			)) {
				const t = (el.textContent || "").trim().toLowerCase()
				if (["see more", "виж повече", "voir plus"].includes(t)) {
					el.click()
				}
			}
		})
		.catch(() => {})
	await sleep(800)

	const data = await page.evaluate(() => {
		const meta = (prop) =>
			document
				.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)
				?.getAttribute("content") || null

		const main = document.querySelector('[role="main"]')

		// Facebook wraps outbound links in l.facebook.com/l.php?u=<encoded>, and
		// shows them abbreviated ("site.com/.../x"). Resolve the real target so
		// we can swap the abbreviated visible text for the full URL later.
		const links = []
		if (main) {
			for (const a of main.querySelectorAll("a[href]")) {
				const text = (a.textContent || "").trim()
				let href = a.getAttribute("href") || ""
				const u = href.match(/[?&]u=([^&]+)/)
				if (u) {
					try {
						href = decodeURIComponent(u[1])
					} catch {
						/* keep raw href */
					}
				}
				if (
					text &&
					/(\.\.\.|^https?:\/\/)/.test(text) &&
					href.startsWith("http") &&
					!/facebook\.com/.test(href)
				) {
					links.push({ text, href })
				}
			}

			// innerText drops <img>, but FB renders emoji as <img alt="🌭">.
			// Swap them back so the description keeps its emoji.
			for (const img of main.querySelectorAll("img[alt]")) {
				const alt = img.getAttribute("alt") || ""
				if (alt && /\p{Extended_Pictographic}/u.test(alt)) {
					img.replaceWith(document.createTextNode(alt))
				}
			}
		}

		const html = document.documentElement.innerHTML

		// Cover image: the largest image inside the event's main region (the
		// embedded cover_photo JSON is page-global and leaks the sidebar's
		// cover, so it's only a last-resort fallback).
		let cover = null
		if (main) {
			const big = [...main.querySelectorAll("img")]
				.map((i) => ({
					src: i.currentSrc || i.src,
					area: i.naturalWidth * i.naturalHeight,
					w: i.naturalWidth,
				}))
				.filter((i) => i.src?.startsWith("http") && i.w >= 400)
				.sort((a, b) => b.area - a.area)[0]
			cover = big?.src || null
		}
		if (!cover) {
			const cm = html.match(
				/"cover_photo".{0,400}?"uri":"(https:\\?\/\\?\/[^"]+?)"/,
			)
			if (cm) {
				cover = cm[1].replace(/\\\//g, "/").replace(/\\u0025/g, "%")
			}
		}

		// innerText (read last; emoji <img> were swapped to text above).
		const mainText = main ? main.innerText : document.body?.innerText || ""

		// Start time: prefer an embedded epoch (UTC) from the page's JSON blobs.
		let embeddedStart = null
		const m =
			html.match(/"start_timestamp":(\d{9,})/) ||
			html.match(/"startTimestamp":(\d{9,})/)
		if (m) {
			embeddedStart = Number.parseInt(m[1], 10) * 1000
		}

		return {
			ogDescription: meta("og:description"),
			docTitle: document.title,
			mainText,
			links,
			coverUrl: cover,
			embeddedStartMs: embeddedStart,
		}
	})

	if (opts.debug && opts.debugDir) {
		fs.mkdirSync(opts.debugDir, { recursive: true })
		await page
			.screenshot({ path: path.join(opts.debugDir, `${id}.png`) })
			.catch(() => {})
		fs.writeFileSync(
			path.join(opts.debugDir, `${id}.txt`),
			data.mainText,
			"utf8",
		)
	}

	const name = cleanName(data.docTitle) || `Event ${id}`
	const { venue, description } = parseMainText(data.mainText)

	// Replace Facebook's abbreviated link text (site.com/.../x) with the real URL.
	let resolved = description
	for (const { text, href } of data.links || []) {
		if (text && resolved.includes(text)) {
			resolved = resolved.split(text).join(cleanUrl(href))
		}
	}
	const finalDescription = resolved || data.ogDescription || ""

	let startISO = null
	let startRaw = null
	if (data.embeddedStartMs) {
		startISO = epochToLocalISO(data.embeddedStartMs, tz)
		startRaw = `embedded:${data.embeddedStartMs}`
	}

	// Cheap source-language hint (DeepL re-detects at build time). Cyrillic =>
	// Bulgarian; French accents/stopwords => French; otherwise English.
	const sample = `${name} ${finalDescription}`
	let lang = "en"
	if (/[Ѐ-ӿ]/.test(sample)) {
		lang = "bg"
	} else if (
		/[àâçéèêëîïôûùüœ]/i.test(sample) ||
		/\b(le|la|les|des|une|pour|événement|gratuit|à)\b/i.test(sample)
	) {
		lang = "fr"
	}

	return {
		fbEventId: id,
		url,
		name,
		description: finalDescription,
		location: venue,
		coverUrl: data.coverUrl || null,
		startISO,
		startRaw,
		lang,
		needsReview: !startISO,
	}
}

module.exports = {
	sleep,
	epochToLocalISO,
	cleanName,
	cleanUrl,
	parseMainText,
	parseEventId,
	buildEventsUrl,
	extractEvent,
}
