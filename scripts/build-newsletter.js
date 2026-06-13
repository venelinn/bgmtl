#!/usr/bin/env node

require("dotenv").config()

/**
 * Build a Brevo-ready HTML newsletter of UPCOMING events (Bulgarian).
 *
 * Reads published events straight from the Contentful Delivery API, keeps only
 * events whose date is today or later, sorts them soonest-first, and writes a
 * compact, inline-CSS, table-based email you can paste into Brevo
 * (Campaigns → create → "Paste your code" / a custom-HTML template).
 *
 * Usage:
 *   node scripts/build-newsletter.js
 *   node scripts/build-newsletter.js --limit 6 --out path/to/file.html
 *
 * Env (from .env):
 * - CONTENTFUL_SPACE_ID        (default: huajfyusfsch)
 * - CONTENTFUL_ENVIRONMENT     (default: master)
 * - CONTENTFUL_DELIVERY_TOKEN  (required)
 * - NEXT_PUBLIC_BASE_URL       (default: https://bgmtl.com)
 * - NEXT_PUBLIC_SITE_NAME      (default: bgmtl.com)
 */

const fs = require("fs")
const path = require("path")
const { createClient } = require("contentful")

// ---- config ---------------------------------------------------------------

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const DELIVERY_TOKEN = process.env.CONTENTFUL_DELIVERY_TOKEN
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://bgmtl.com").replace(/\/+$/, "")
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "bgmtl.com"
const LOCALE = "bg-BG"

// ---- brand (mirrors styles/_css-variables.css) ----------------------------
const NAVY = "#022545" // --color-main
const ACCENT = "#00c2f4" // logo accent (.logo-brand / turtle)
const GREEN = "#00a876" // --secondary
// The real BG·MTL logo (Cloudinary SVG used in the site nav), rasterized to a
// transparent PNG via f_png so email clients render it (they don't do SVG).
// w_440 = 2× the ~210px display width for retina.
const LOGO_URL =
	"https://res.cloudinary.com/dgly3nv8f/image/upload/f_png,q_auto,w_440/v1780354271/logo1_c9vany.svg"

const argv = process.argv.slice(2)
const getArg = (name, fallback) => {
	const i = argv.indexOf(`--${name}`)
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback
}
const LIMIT = Number(getArg("limit", "8"))
const OUT_PATH = path.resolve(getArg("out", path.join(__dirname, "output", "newsletter-bg.html")))

if (!DELIVERY_TOKEN) {
	console.error("❌ CONTENTFUL_DELIVERY_TOKEN is required (see .env)")
	process.exit(1)
}

// ---- slug (mirror of utils/common.ts so links match the live site) --------
// NOTE: keep this in sync with transliterateCyrillic/slugify in utils/common.ts.
// Differs from scripts/lib/events-format.js (ь→"" here, no 40-char id cap).

const CYRILLIC_MAP = {
	а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
	й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
	т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht",
	ъ: "a", ь: "", ю: "yu", я: "ya",
}

const slugify = (value) => {
	const latin = String(value)
		.toLowerCase()
		.split("")
		.map((ch) => CYRILLIC_MAP[ch] ?? ch)
		.join("")
	const slug = latin
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
	return slug || "event"
}

// ---- formatting helpers ---------------------------------------------------

const BG_MONTHS = [
	"януари", "февруари", "март", "април", "май", "юни",
	"юли", "август", "септември", "октомври", "ноември", "декември",
]
const BG_WEEKDAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"]

/** Parse the naive local datetime ("2025-12-13T18:30") without timezone shift. */
function parseNaive(value) {
	const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
	if (!m) return null
	const [, y, mo, d, h = "0", mi = "0"] = m
	return {
		date: new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)),
		hasTime: m[4] !== undefined,
	}
}

function formatDateBg(value) {
	const parsed = parseNaive(value)
	if (!parsed) return ""
	const dt = parsed.date
	const wd = BG_WEEKDAYS[dt.getDay()]
	let out = `${wd}, ${dt.getDate()} ${BG_MONTHS[dt.getMonth()]} ${dt.getFullYear()} г.`
	if (parsed.hasTime) {
		const hh = String(dt.getHours()).padStart(2, "0")
		const mm = String(dt.getMinutes()).padStart(2, "0")
		out += ` · ${hh}:${mm} ч.`
	}
	return out
}

/** Flatten a Contentful rich-text document to plain text. */
function richTextToPlain(doc) {
	if (!doc || !Array.isArray(doc.content)) return ""
	const walk = (node) => {
		if (node.nodeType === "text") return node.value || ""
		if (Array.isArray(node.content)) return node.content.map(walk).join("")
		return ""
	}
	return doc.content.map(walk).join(" ").replace(/\s+/g, " ").trim()
}

function truncate(text, max = 140) {
	if (text.length <= max) return text
	return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`
}

function escapeHtml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

/** Cloudinary: inject a fill transform + force https for a small email thumb. */
function thumbUrl(url, w = 240, h = 160) {
	if (!url) return ""
	return url
		.replace(/^http:\/\//, "https://")
		.replace("/image/upload/", `/image/upload/c_fill,w_${w},h_${h}/`)
}

// ---- data -----------------------------------------------------------------

function headingText(event) {
	const h = event.fields?.heading
	// Delivery API resolves the linked heading entry; its display text lives in
	// fields.heading. Fall back to the event's admin title.
	if (h && typeof h === "object" && h.fields) return h.fields.heading || h.fields.title || ""
	if (typeof h === "string") return h
	return event.fields?.title || ""
}

async function fetchUpcomingEvents() {
	const client = createClient({
		space: SPACE_ID,
		environment: ENVIRONMENT,
		accessToken: DELIVERY_TOKEN,
		host: "cdn.contentful.com", // ignore CONTENTFUL_HOST (preview) for this read
	})

	const res = await client.getEntries({
		content_type: "event",
		locale: LOCALE,
		include: 2,
		limit: 200,
	})

	// Start of today, local time — an event happening later today still counts.
	const startOfToday = new Date()
	startOfToday.setHours(0, 0, 0, 0)
	const cutoff = startOfToday.getTime()

	return res.items
		.map((e) => {
			const title = headingText(e)
			return {
				title,
				date: e.fields.date,
				when: formatDateBg(e.fields.date),
				ts: parseNaive(e.fields.date)?.date.getTime() ?? 0,
				venue: e.fields.venue || "",
				excerpt: truncate(richTextToPlain(e.fields.excerpt)),
				image: thumbUrl(e.fields.cover?.[0]?.secure_url || e.fields.cover?.[0]?.url, 560, 350),
				url: `${BASE_URL}/events/${slugify(title || e.fields.venue || "event")}`,
			}
		})
		.filter((e) => e.ts >= cutoff)
		.sort((a, b) => a.ts - b.ts)
		.slice(0, LIMIT)
}

// ---- HTML -----------------------------------------------------------------

function eventCard(e) {
	const img = e.image
		? `<td class="ev-img" width="168" valign="top" style="padding:0 14px 0 0;">
            <a href="${e.url}" style="text-decoration:none;">
              <img src="${e.image}" width="168" height="112" alt="" class="ev-img-i" style="display:block;width:168px;height:112px;object-fit:cover;border-radius:10px;border:0;" />
            </a>
          </td>`
		: ""
	return `
      <tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e9edf2;border-radius:14px;">
            <tr>
              <td style="padding:14px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    ${img}
                    <td class="ev-body" valign="top">
                      <span style="display:inline-block;background:${ACCENT};color:${NAVY};font-size:11px;font-weight:700;line-height:1;padding:6px 10px;border-radius:999px;">${escapeHtml(e.when)}</span>
                      <a href="${e.url}" style="display:block;color:${NAVY};font-size:16px;font-weight:700;line-height:1.3;text-decoration:none;margin:9px 0 0;">${escapeHtml(e.title)}</a>
                      ${e.venue ? `<div style="color:#6b7785;font-size:12px;line-height:1.4;margin:4px 0 0;">📍 ${escapeHtml(e.venue)}</div>` : ""}
                      ${e.excerpt ? `<div style="color:#48535f;font-size:13px;line-height:1.55;margin:7px 0 0;">${escapeHtml(e.excerpt)}</div>` : ""}
                      <a href="${e.url}" style="display:inline-block;margin-top:10px;color:${GREEN};font-size:13px;font-weight:700;text-decoration:none;">Виж повече →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
}

function buildHtml(events) {
	const cards = events.map(eventCard).join("")
	return `<!doctype html>
<html lang="bg" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="color-scheme" content="light only" />
  <title>Предстоящи събития</title>
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    img { border:0; line-height:100%; outline:none; text-decoration:none; }
    a { text-decoration:none; }
    @media only screen and (max-width:600px) {
      .container { width:100% !important; border-radius:0 !important; }
      .px { padding-left:18px !important; padding-right:18px !important; }
      .ev-img, .ev-body { display:block !important; width:100% !important; padding:0 !important; }
      .ev-img { padding-bottom:12px !important; }
      .ev-img-i { width:100% !important; height:auto !important; }
      .h1 { font-size:22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef1f5;">
  <!-- preheader: shown in inbox preview, hidden in body -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Виж какво предстои в българската общност в Монреал 🎉</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;background:#f4f6f9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- logo band -->
          <tr>
            <td align="center" bgcolor="${NAVY}" style="background:${NAVY};padding:26px 24px;">
              <img src="${LOGO_URL}" width="210" alt="${escapeHtml(SITE_NAME)}" style="display:block;width:210px;max-width:60%;height:auto;border:0;" />
            </td>
          </tr>
          <!-- accent rule -->
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${ACCENT};">&nbsp;</td></tr>

          <!-- intro -->
          <tr>
            <td class="px" style="padding:28px 32px 6px;">
              <h1 class="h1" style="margin:0;color:${NAVY};font-size:24px;line-height:1.25;font-weight:800;">Здравей! 👋</h1>
              <p style="margin:14px 0 0;color:#48535f;font-size:14px;line-height:1.65;">
                Радваме се, че си част от българската общност в Монреал! Събрахме на едно място
                най-интересното, което предстои през следващите седмици.
              </p>
              <p style="margin:12px 0 0;color:#48535f;font-size:14px;line-height:1.65;">
                Запази си датите, покани приятели и заповядай — очакваме те! 🎉
              </p>
            </td>
          </tr>

          <!-- section label -->
          <tr>
            <td class="px" style="padding:24px 32px 12px;">
              <span style="display:inline-block;color:${GREEN};font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">✨ Предстоящи събития</span>
            </td>
          </tr>

          <!-- event cards -->
          <tr>
            <td class="px" style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${cards}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td class="px" align="center" style="padding:14px 32px 32px;">
              <a href="${BASE_URL}/events" style="display:inline-block;background:${NAVY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px;">Виж всички събития →</a>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td bgcolor="${NAVY}" style="background:${NAVY};padding:24px 32px;">
              <p style="margin:0;color:#aebccd;font-size:12px;line-height:1.6;">
                С обич от екипа на <a href="${BASE_URL}" style="color:${ACCENT};font-weight:600;">${escapeHtml(SITE_NAME)}</a> 🐢
              </p>
              <p style="margin:12px 0 0;color:#7e8ea3;font-size:11px;line-height:1.6;">
                Получаваш този имейл, защото си абониран(а) за бюлетина на ${escapeHtml(SITE_NAME)}.<br />
                <a href="{{ unsubscribe }}" style="color:#aebccd;text-decoration:underline;">Отписване</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---- main -----------------------------------------------------------------

async function main() {
	const events = await fetchUpcomingEvents()
	if (events.length === 0) {
		console.warn("⚠️  No upcoming events found — writing an empty template anyway.")
	}
	const html = buildHtml(events)
	fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
	fs.writeFileSync(OUT_PATH, html, "utf8")
	console.log(`✅ ${events.length} upcoming event(s) → ${OUT_PATH}`)
	for (const e of events) console.log(`   • ${e.when} — ${e.title}`)
}

main().catch((err) => {
	console.error("❌ Failed to build newsletter:", err)
	process.exit(1)
})
