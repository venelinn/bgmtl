/**
 * Shared, framework-agnostic renderer for the Brevo HTML newsletter.
 *
 * Pure string-building + formatting only — NO Contentful / Brevo / fs deps — so
 * it can be `require()`d by scripts/build-newsletter.js (Node CLI) AND imported
 * by app/api/newsletter/route.ts (Next, via allowJs + esModuleInterop). Both
 * callers feed it the same normalized shape, so the email is identical whatever
 * the trigger.
 *
 * Contract:
 *   item    = { type:'event'|'news', title, when, venue?, excerpt?, image?, url }
 *   section = { label: string, items: item[] }
 *   renderNewsletter({ siteName, baseUrl, intro?, preheader?, sections, ctaUrl?, ctaLabel? })
 */

// ---- brand (mirrors styles/_css-variables.css) ----------------------------
const NAVY = "#022545" // --color-main
const ACCENT = "#00c2f4" // logo accent (.logo-brand / turtle)
const GREEN = "#00a876" // --secondary
// The real BG·MTL logo (Cloudinary SVG used in the site nav), rasterized to a
// transparent PNG via f_png so email clients render it (they don't do SVG).
// w_440 = 2× the ~210px display width for retina.
const LOGO_URL =
	"https://res.cloudinary.com/dgly3nv8f/image/upload/f_png,q_auto,w_440/v1780354271/logo1_c9vany.svg"

const DEFAULT_INTRO =
	"Радваме се, че си част от българската общност в Монреал! Събрахме на едно място най-интересното, което предстои през следващите седмици.\n\nЗапази си датите, покани приятели и заповядай — очакваме те! 🎉"
const DEFAULT_PREHEADER =
	"Виж какво предстои в българската общност в Монреал 🎉"

// ---- date formatting (Bulgarian) ------------------------------------------

const BG_MONTHS = [
	"януари",
	"февруари",
	"март",
	"април",
	"май",
	"юни",
	"юли",
	"август",
	"септември",
	"октомври",
	"ноември",
	"декември",
]
const BG_WEEKDAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"]

/** Parse the naive local datetime ("2025-12-13T18:30") without timezone shift. */
function parseNaive(value) {
	const m = String(value || "").match(
		/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/,
	)
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
	// Show the time only when it's a real (non-midnight) start time.
	if (parsed.hasTime && (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
		const hh = String(dt.getHours()).padStart(2, "0")
		const mm = String(dt.getMinutes()).padStart(2, "0")
		out += ` · ${hh}:${mm} ч.`
	}
	return out
}

// ---- text helpers ---------------------------------------------------------

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
	if (!text) return ""
	if (text.length <= max) return text
	return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`
}

function escapeHtml(text) {
	return String(text ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

/** Cloudinary: inject a fill transform + force https for a small email thumb. */
function thumbUrl(url, w = 560, h = 350) {
	if (!url) return ""
	return url
		.replace(/^http:\/\//, "https://")
		.replace("/image/upload/", `/image/upload/c_fill,w_${w},h_${h}/`)
}

// ---- cards ----------------------------------------------------------------

function card(item, ctaText) {
	const img = item.image
		? `<td class="ev-img" width="168" valign="top" style="padding:0 14px 0 0;">
            <a href="${item.url}" style="text-decoration:none;">
              <img src="${item.image}" width="168" height="112" alt="" class="ev-img-i" style="display:block;width:168px;height:112px;object-fit:cover;border-radius:10px;border:0;" />
            </a>
          </td>`
		: ""
	const meta = item.venue
		? `<div style="color:#6b7785;font-size:12px;line-height:1.4;margin:4px 0 0;">📍 ${escapeHtml(item.venue)}</div>`
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
                      ${item.when ? `<span style="display:inline-block;background:${ACCENT};color:${NAVY};font-size:11px;font-weight:700;line-height:1;padding:6px 10px;border-radius:999px;">${escapeHtml(item.when)}</span>` : ""}
                      <a href="${item.url}" style="display:block;color:${NAVY};font-size:16px;font-weight:700;line-height:1.3;text-decoration:none;margin:9px 0 0;">${escapeHtml(item.title)}</a>
                      ${meta}
                      ${item.excerpt ? `<div style="color:#48535f;font-size:13px;line-height:1.55;margin:7px 0 0;">${escapeHtml(item.excerpt)}</div>` : ""}
                      <a href="${item.url}" style="display:inline-block;margin-top:10px;color:${GREEN};font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(ctaText)} →</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
}

function sectionBlock(section) {
	const cardCta = section.items[0]?.type === "news" ? "Прочети" : "Виж повече"
	const cards = section.items.map((it) => card(it, cardCta)).join("")
	return `
          <!-- section: ${escapeHtml(section.label)} -->
          <tr>
            <td class="px" style="padding:24px 32px 12px;">
              <span style="display:inline-block;color:${GREEN};font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(section.label)}</span>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${cards}
              </table>
            </td>
          </tr>`
}

// ---- shell ----------------------------------------------------------------

function renderNewsletter({
	siteName = "bgmtl.com",
	baseUrl = "https://bgmtl.com",
	intro = DEFAULT_INTRO,
	preheader = DEFAULT_PREHEADER,
	sections = [],
	ctaUrl,
	ctaLabel = "Виж всички събития",
}) {
	const introParas = String(intro || "")
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)
		.map(
			(p) =>
				`<p style="margin:14px 0 0;color:#48535f;font-size:14px;line-height:1.65;">${escapeHtml(p)}</p>`,
		)
		.join("")

	const body = sections
		.filter((s) => s && Array.isArray(s.items) && s.items.length > 0)
		.map(sectionBlock)
		.join("")

	const cta = ctaUrl || `${baseUrl}/events`

	return `<!doctype html>
<html lang="bg" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(siteName)}</title>
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" style="width:600px;max-width:600px;background:#f4f6f9;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

          <!-- logo band -->
          <tr>
            <td align="center" bgcolor="${NAVY}" style="background:${NAVY};padding:26px 24px;">
              <img src="${LOGO_URL}" width="210" alt="${escapeHtml(siteName)}" style="display:block;width:210px;max-width:60%;height:auto;border:0;" />
            </td>
          </tr>
          <!-- accent rule -->
          <tr><td style="height:4px;line-height:4px;font-size:0;background:${ACCENT};">&nbsp;</td></tr>

          <!-- intro -->
          <tr>
            <td class="px" style="padding:28px 32px 6px;">
              <h1 class="h1" style="margin:0;color:${NAVY};font-size:24px;line-height:1.25;font-weight:800;">Здравей! 👋</h1>
              ${introParas}
            </td>
          </tr>

          ${body}

          <!-- CTA -->
          <tr>
            <td class="px" align="center" style="padding:14px 32px 32px;">
              <a href="${cta}" style="display:inline-block;background:${NAVY};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px;">${escapeHtml(ctaLabel)} →</a>
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td bgcolor="${NAVY}" style="background:${NAVY};padding:24px 32px;">
              <p style="margin:0;color:#aebccd;font-size:12px;line-height:1.6;">
                С обич от екипа на <a href="${baseUrl}" style="color:${ACCENT};font-weight:600;">${escapeHtml(siteName)}</a> 🐢
              </p>
              <p style="margin:12px 0 0;color:#7e8ea3;font-size:11px;line-height:1.6;">
                Получаваш този имейл, защото си абониран(а) за бюлетина на ${escapeHtml(siteName)}.<br />
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

module.exports = {
	renderNewsletter,
	// helpers reused by data layers (CLI + endpoint)
	formatDateBg,
	parseNaive,
	richTextToPlain,
	truncate,
	thumbUrl,
	escapeHtml,
	// constants
	NAVY,
	ACCENT,
	GREEN,
	LOGO_URL,
}
