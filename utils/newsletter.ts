/**
 * Server-side newsletter assembly + Brevo draft creation.
 *
 * Used by app/api/newsletter/route.ts (the Contentful webhook). Pulls content via
 * the app's existing Contentful fetchers, normalizes it to the renderer's item
 * contract, and renders with the SAME shared renderer the CLI uses
 * (scripts/lib/newsletter-render.js) so the email is identical either way.
 */

import { createClient as createManagementClient } from "contentful-management"
import { getAllEvents, getAllNews, getEventById } from "./content"
import { getEventPermalink, getNewsPermalink } from "./common"
// Shared pure renderer (CommonJS — allowed via tsconfig allowJs + esModuleInterop).
import {
	renderNewsletter,
	formatDateBg,
	parseNaive,
	richTextToPlain,
	truncate,
	thumbUrl,
} from "../scripts/lib/newsletter-render"

const BASE_URL = (
	process.env.NEXT_PUBLIC_BASE_URL || "https://bgmtl.com"
).replace(/\/+$/, "")
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "bgmtl.com"
const LOCALE = "bg"
const DEFAULT_MAX = 8

const EVENTS_LABEL = "✨ Предстоящи събития"
const NEWS_LABEL = "📰 Новини"

export type NewsletterMode =
	| "upcomingEvents"
	| "selectedEvents"
	| "news"
	| "eventsAndNews"
export const NEWSLETTER_MODES: NewsletterMode[] = [
	"upcomingEvents",
	"selectedEvents",
	"news",
	"eventsAndNews",
]

type Item = {
	type: "event" | "news"
	title: string
	when: string
	venue?: string
	excerpt?: string
	image?: string
	url: string
}
type Section = { label: string; items: Item[] }

// ---- normalization (mirror Event.tsx / News.tsx heading + cover logic) -----

function headingText(entry: any): string {
	const h = entry?.heading
	if (typeof h === "string") return h
	if (h && typeof h === "object" && "heading" in h) return h.heading as string
	return entry?.title || ""
}

function eventToItem(e: any): Item {
	const title = headingText(e)
	const slugSource = e.bgHeading || title
	return {
		type: "event",
		title,
		when: formatDateBg(e.date),
		venue: e.venue || "",
		excerpt: truncate(richTextToPlain(e.excerpt)),
		image: thumbUrl(e.cover?.[0]?.src),
		url: `${BASE_URL}${getEventPermalink({ locale: LOCALE, title: String(slugSource || "event"), venue: e.venue })}`,
	}
}

function newsToItem(n: any): Item {
	const title = headingText(n)
	const slugSource = n.bgHeading || title
	return {
		type: "news",
		title,
		when: formatDateBg(n.date),
		excerpt: truncate(richTextToPlain(n.excerpt)),
		image: thumbUrl(n.cover?.[0]?.src),
		url: `${BASE_URL}${getNewsPermalink({ locale: LOCALE, title: String(slugSource || "news") })}`,
	}
}

// ---- data per mode ---------------------------------------------------------

function startOfToday(now: number): number {
	const d = new Date(now)
	d.setHours(0, 0, 0, 0)
	return d.getTime()
}

async function upcomingEvents(max: number): Promise<Item[]> {
	const events = (await getAllEvents(LOCALE)) as any[]
	const cutoff = startOfToday(Date.now())
	return events
		.map((e) => ({
			item: eventToItem(e),
			ts: parseNaive(e.date)?.date.getTime() ?? 0,
		}))
		.filter(({ ts }) => ts >= cutoff)
		.sort((a, b) => a.ts - b.ts)
		.slice(0, max)
		.map(({ item }) => item)
}

async function selectedEvents(ids: string[]): Promise<Item[]> {
	if (!ids.length) return []
	const entries = await Promise.all(ids.map((id) => getEventById(id, LOCALE)))
	return entries.filter(Boolean).map(eventToItem) // preserve the chosen order
}

async function latestNews(max: number): Promise<Item[]> {
	const news = await getAllNews(LOCALE) // already date-descending
	return (news as any[]).slice(0, max).map(newsToItem)
}

/** Build the labelled sections for a given mode. */
export async function collectSections(
	mode: NewsletterMode,
	opts: { selectedEventIds?: string[]; max?: number } = {},
): Promise<Section[]> {
	const max = opts.max || DEFAULT_MAX
	switch (mode) {
		case "selectedEvents":
			return [
				{
					label: EVENTS_LABEL,
					items: await selectedEvents(opts.selectedEventIds || []),
				},
			]
		case "news":
			return [{ label: NEWS_LABEL, items: await latestNews(max) }]
		case "eventsAndNews":
			return [
				{ label: EVENTS_LABEL, items: await upcomingEvents(max) },
				{ label: NEWS_LABEL, items: await latestNews(max) },
			]
		default:
			return [{ label: EVENTS_LABEL, items: await upcomingEvents(max) }]
	}
}

// ---- orchestration ---------------------------------------------------------

export type NewsletterConfig = {
	mode: NewsletterMode
	intro?: string
	subject?: string
	preheader?: string
	selectedEventIds?: string[]
	max?: number
}

/** Assemble + render the newsletter HTML for a config. Returns html + item count. */
export async function buildNewsletter(
	config: NewsletterConfig,
): Promise<{ html: string; total: number; subject: string }> {
	const sections = await collectSections(config.mode, {
		selectedEventIds: config.selectedEventIds,
		max: config.max,
	})
	const total = sections.reduce((n, s) => n + s.items.length, 0)
	const html = renderNewsletter({
		siteName: SITE_NAME,
		baseUrl: BASE_URL,
		intro: config.intro,
		preheader: config.preheader,
		sections,
	})
	return { html, total, subject: config.subject || "Бюлетин на общността" }
}

/** Read a mapped `newsletter` entry's fields into a NewsletterConfig. */
export function entryToConfig(entry: any): NewsletterConfig {
	const mode = (
		NEWSLETTER_MODES.includes(entry?.contentMode)
			? entry.contentMode
			: "upcomingEvents"
	) as NewsletterMode
	return {
		mode,
		intro: entry?.intro || undefined,
		subject: entry?.subject || undefined,
		preheader: entry?.preheader || undefined,
		selectedEventIds: Array.isArray(entry?.events)
			? entry.events.map((ev: any) => ev?.id).filter(Boolean)
			: [],
		max: Number(entry?.maxItems) || DEFAULT_MAX,
	}
}

// ---- Brevo -----------------------------------------------------------------

/** Create a Brevo DRAFT email campaign (no scheduledAt ⇒ never auto-sends). */
export async function createBrevoDraft({
	name,
	subject,
	html,
}: {
	name: string
	subject: string
	html: string
}): Promise<number> {
	const KEY = process.env.BREVO_API_KEY
	const LIST_ID = process.env.BREVO_LIST_ID
	const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL
	const SENDER_NAME = process.env.BREVO_SENDER_NAME || SITE_NAME
	if (!KEY || !LIST_ID || !SENDER_EMAIL) {
		throw new Error(
			"Brevo draft needs BREVO_API_KEY, BREVO_LIST_ID and BREVO_SENDER_EMAIL",
		)
	}

	const res = await fetch("https://api.brevo.com/v3/emailCampaigns", {
		method: "POST",
		headers: {
			"api-key": KEY,
			"Content-Type": "application/json",
			accept: "application/json",
		},
		body: JSON.stringify({
			name,
			subject,
			sender: { name: SENDER_NAME, email: SENDER_EMAIL },
			htmlContent: html,
			recipients: { listIds: [Number(LIST_ID)] },
		}),
	})
	const data = await res.json().catch(() => ({}))
	if (!res.ok) throw new Error(`Brevo ${res.status}: ${JSON.stringify(data)}`)
	return data.id
}

function brevoHeaders() {
	const KEY = process.env.BREVO_API_KEY
	if (!KEY) throw new Error("Missing BREVO_API_KEY")
	return {
		"api-key": KEY,
		"Content-Type": "application/json",
		accept: "application/json",
	}
}

/** Update an existing Brevo campaign's content (PUT). */
export async function updateBrevoCampaign(
	id: number,
	{ subject, html }: { subject: string; html: string },
): Promise<void> {
	const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL
	const SENDER_NAME = process.env.BREVO_SENDER_NAME || SITE_NAME
	const res = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}`, {
		method: "PUT",
		headers: brevoHeaders(),
		body: JSON.stringify({
			subject,
			sender: { name: SENDER_NAME, email: SENDER_EMAIL },
			htmlContent: html,
		}),
	})
	if (!res.ok && res.status !== 204) {
		const data = await res.json().catch(() => ({}))
		throw new Error(`Brevo update ${res.status}: ${JSON.stringify(data)}`)
	}
}

/** Send a Brevo campaign to its list immediately. */
export async function sendBrevoCampaign(id: number): Promise<void> {
	const res = await fetch(
		`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`,
		{
			method: "POST",
			headers: brevoHeaders(),
		},
	)
	if (!res.ok && res.status !== 204) {
		const data = await res.json().catch(() => ({}))
		throw new Error(`Brevo sendNow ${res.status}: ${JSON.stringify(data)}`)
	}
}

// ---- Contentful Management (read fresh entry + write back send state) -------

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT || "master"
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN

let cachedEnv: any = null
let cachedDefaultLocale: string | null = null

async function getManagementEnv() {
	if (cachedEnv) return cachedEnv
	if (!SPACE_ID || !MANAGEMENT_TOKEN) {
		throw new Error(
			"Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN",
		)
	}
	// Use the chainable (legacy) client — getSpace/getEnvironment/getEntry — as
	// the scripts/ do. The default v12 client is the plain API (no getSpace).
	const client = createManagementClient(
		{ accessToken: MANAGEMENT_TOKEN },
		{ type: "legacy" },
	) as any
	const space = await client.getSpace(SPACE_ID)
	cachedEnv = await space.getEnvironment(ENVIRONMENT_ID)
	return cachedEnv
}

async function getDefaultLocale(env: any): Promise<string> {
	if (cachedDefaultLocale) return cachedDefaultLocale
	const locales = await env.getLocales()
	const def = locales.items.find((l: any) => l.default) || locales.items[0]
	cachedDefaultLocale = def.code
	return cachedDefaultLocale as string
}

/** Read a localized field map, falling back across likely locales. */
function readField(fields: any, key: string, defaultLocale: string): any {
	const map = fields?.[key]
	if (!map) return undefined
	return (
		map[defaultLocale] ?? map["bg-BG"] ?? map["en-CA"] ?? Object.values(map)[0]
	)
}

/** Map a management-API newsletter entry's raw fields → NewsletterConfig. */
function mgmtFieldsToConfig(
	fields: any,
	defaultLocale: string,
): NewsletterConfig {
	const rawMode = readField(fields, "contentMode", defaultLocale)
	const mode = (
		NEWSLETTER_MODES.includes(rawMode) ? rawMode : "upcomingEvents"
	) as NewsletterMode
	const events = readField(fields, "events", defaultLocale)
	return {
		mode,
		intro: readField(fields, "intro", defaultLocale) || undefined,
		subject: readField(fields, "subject", defaultLocale) || undefined,
		preheader: readField(fields, "preheader", defaultLocale) || undefined,
		selectedEventIds: Array.isArray(events)
			? events.map((ev: any) => ev?.sys?.id).filter(Boolean)
			: [],
		max: Number(readField(fields, "maxItems", defaultLocale)) || DEFAULT_MAX,
	}
}

export type NewsletterAction =
	| "dryRun"
	| "draft"
	| "sent"
	| "skipped-already-sent"
export type NewsletterResult = {
	html: string
	total: number
	subject: string
	action: NewsletterAction
	campaignId?: number
	status: string
}

/**
 * The whole CMS-driven flow for one newsletter entry. Reads the entry FRESH via
 * the Management API (bypasses the indefinite delivery cache and gives us write
 * access), builds the email, then:
 *   - dryRun        → just returns the HTML (preview / testing)
 *   - already sent  → no-op (sentAt is the double-send guard)
 *   - status=send   → (create or update) campaign → sendNow → write back sentAt+id+status='sent'
 *   - else (draft)  → (create or update) a Brevo draft → write back the id once
 *
 * Write-backs publish the entry, which re-fires the webhook — but the guards
 * above make the second pass a no-op, so it terminates.
 */
export async function processNewsletterEntry(
	entryId: string,
	opts: { dryRun?: boolean } = {},
): Promise<NewsletterResult> {
	const env = await getManagementEnv()
	const defaultLocale = await getDefaultLocale(env)
	const entry = await env.getEntry(entryId)
	const fields = entry.fields

	const config = mgmtFieldsToConfig(fields, defaultLocale)
	const { html, total, subject } = await buildNewsletter(config)

	const status = readField(fields, "status", defaultLocale) || "draft"

	if (opts.dryRun) {
		return { html, total, subject, action: "dryRun", status }
	}

	const sentAt = readField(fields, "sentAt", defaultLocale)
	const existingIdRaw = readField(fields, "brevoCampaignId", defaultLocale)
	const existingId = existingIdRaw ? Number(existingIdRaw) : undefined

	// Guard: once sent, never touch it again (re-publish becomes a no-op).
	if (sentAt) {
		return {
			html,
			total,
			subject,
			action: "skipped-already-sent",
			campaignId: existingId,
			status,
		}
	}

	const today = new Date().toISOString().slice(0, 10)
	const name = `${subject} — ${today}`

	if (status === "send") {
		let id = existingId
		if (id) await updateBrevoCampaign(id, { subject, html })
		else id = await createBrevoDraft({ name, subject, html })
		await sendBrevoCampaign(id)
		await writeBack(entry, defaultLocale, {
			brevoCampaignId: String(id),
			sentAt: new Date().toISOString(),
			status: "sent",
		})
		return {
			html,
			total,
			subject,
			action: "sent",
			campaignId: id,
			status: "sent",
		}
	}

	// Draft mode: keep a single draft in sync; only write back when first created.
	let id = existingId
	if (id) {
		await updateBrevoCampaign(id, { subject, html })
	} else {
		id = await createBrevoDraft({ name, subject, html })
		await writeBack(entry, defaultLocale, { brevoCampaignId: String(id) })
	}
	return { html, total, subject, action: "draft", campaignId: id, status }
}

/** Patch fields on a management entry and publish it. */
async function writeBack(
	entry: any,
	locale: string,
	values: Record<string, string>,
): Promise<void> {
	for (const [key, value] of Object.entries(values)) {
		entry.fields[key] = { ...(entry.fields[key] || {}), [locale]: value }
	}
	const updated = await entry.update()
	await updated.publish()
}
