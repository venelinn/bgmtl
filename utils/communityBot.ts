import { createClient } from "contentful-management"

/**
 * Telegram → Community directory: message parsing + Contentful logic for the bot.
 *
 * Stateless by design (serverless): the preview IS an unpublished
 * `directoryEntry` draft in Contentful. The Telegram buttons carry only the
 * draft's entry id, so "Publish" / "Discard" need no database. Publishing in
 * Contentful fires the existing revalidation webhook, so the page updates itself.
 */

const DEFAULT_LOCALE = "bg-BG"
const SPACE_LOCALES = ["bg-BG", "en-CA", "fr-CA"]
export const DRAFT_ID_PREFIX = "directory-entry-tg-"

export type Category = { slug: string; label: string; names: string[] }

export type ParsedListing = {
	name: string
	city: string
	categories: string[]
	/** Category text the sender typed that matched nothing in the taxonomy. */
	unknownCategories: string[]
	phone?: string
	email?: string
	website?: string
	address?: string
	/** Anything the sender mentioned that doesn't fit a field (shown in the preview, not saved). */
	unmapped?: string
}

function cma() {
	const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN
	const spaceId = process.env.CONTENTFUL_SPACE_ID
	if (!accessToken || !spaceId)
		throw new Error("Missing CONTENTFUL_MANAGEMENT_TOKEN / CONTENTFUL_SPACE_ID")
	return createClient(
		{ accessToken },
		{
			type: "plain",
			defaults: {
				spaceId,
				environmentId: process.env.CONTENTFUL_ENVIRONMENT || "master",
			},
		},
	)
}

/** Live category list, so tags can only be ones that really exist. */
export async function getCategories(): Promise<Category[]> {
	const res = await cma().entry.getMany({
		query: {
			content_type: "communityCategory",
			limit: 200,
			order: "fields.order",
		},
	})
	return res.items
		.map((e: any) => {
			const labels = Object.values(e.fields.label ?? {}) as string[]
			return {
				slug: (e.fields.slug?.[DEFAULT_LOCALE] ??
					Object.values(e.fields.slug ?? {})[0]) as string,
				label: (e.fields.label?.["en-CA"] ?? labels[0]) as string,
				names: labels,
			}
		})
		.filter((c) => Boolean(c.slug))
}

export const TEMPLATE = `Name: Българска пекарна Роза
Category: food
City: montreal
Phone: 514-555-0100
Email: info@roza.ca
Website: https://roza.ca
Address: 123 Rue Saint-Denis, Montréal`

// Accepted labels (English + Bulgarian) → field.
const KEYS: Record<string, string> = {
	name: "name",
	име: "name",
	category: "categories",
	categories: "categories",
	tags: "categories",
	категория: "categories",
	категории: "categories",
	city: "city",
	град: "city",
	phone: "phone",
	tel: "phone",
	телефон: "phone",
	тел: "phone",
	email: "email",
	"e-mail": "email",
	имейл: "email",
	website: "website",
	web: "website",
	site: "website",
	url: "website",
	сайт: "website",
	уебсайт: "website",
	address: "address",
	адрес: "address",
}

const CITY_ALIASES: Record<string, string> = {
	монреал: "montreal",
	montréal: "montreal",
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const URL_RE = /(https?:\/\/|www\.)\S+/i

/**
 * Parse a "Label: value" message (see TEMPLATE). Deterministic — no external
 * service. Lenient: labels are case-insensitive and may be Bulgarian; an
 * unlabeled first line is the name; unlabeled emails/URLs are recognised.
 */
export function parseListing(
	text: string,
	categories: Category[],
): ParsedListing {
	const f: Record<string, string> = {}
	const leftovers: string[] = []

	for (const raw of text.split("\n")) {
		const line = raw.trim()
		if (!line || line.startsWith("/")) continue
		const m = line.match(/^([^:：]{1,20}?)\s*[:：]\s*(.+)$/)
		const field = m && KEYS[m[1].trim().toLowerCase()]
		if (field && m) {
			f[field] ||= m[2].trim()
		} else if (EMAIL_RE.test(line) && !f.email) {
			f.email = line.match(EMAIL_RE)?.[0] as string
		} else if (URL_RE.test(line) && !f.website) {
			f.website = line.match(URL_RE)?.[0] as string
		} else if (!f.name) {
			f.name = line
		} else {
			leftovers.push(line)
		}
	}

	if (!f.name)
		throw new Error("I need at least a name. Send /new for the format.")

	const byName = new Map<string, string>()
	for (const c of categories) {
		byName.set(norm(c.slug), c.slug)
		for (const n of c.names) byName.set(norm(n), c.slug)
	}
	const picked = new Set<string>()
	const unknown: string[] = []
	for (const part of (f.categories ?? "").split(/[,;]/)) {
		if (!part.trim()) continue
		const slug = byName.get(norm(part))
		if (slug) picked.add(slug)
		else unknown.push(part.trim())
	}

	let website = f.website
	if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`

	const cityKey = (f.city ?? "montreal").trim().toLowerCase()
	const city = CITY_ALIASES[cityKey] ?? norm(cityKey).replace(/ /g, "-")

	return {
		name: f.name,
		city,
		categories: [...picked],
		unknownCategories: unknown,
		phone: f.phone,
		email: f.email,
		website,
		address: f.address,
		unmapped: leftovers.join(" · ") || undefined,
	}
}

const norm = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()

/** Names of existing entries in the city that look like `name` (published or draft). */
export async function findDuplicates(
	name: string,
	city: string,
): Promise<string[]> {
	const res = await cma().entry.getMany({
		query: {
			content_type: "directoryEntry",
			"fields.city": city,
			limit: 1000,
			select: "sys.id,fields.name",
		},
	})
	const target = norm(name)
	return res.items
		.map(
			(e: any) => Object.values(e.fields.name ?? {})[0] as string | undefined,
		)
		.filter((n): n is string => Boolean(n))
		.filter((n) => {
			const x = norm(n)
			return (
				x === target ||
				(target.length > 3 && (x.includes(target) || target.includes(x)))
			)
		})
}

/**
 * Create the UNPUBLISHED draft. Id is derived from the Telegram update id, so a
 * Telegram retry of the same message can't create a second draft.
 */
export async function createDraft(
	listing: ParsedListing,
	updateId: number,
): Promise<string> {
	const entryId = `${DRAFT_ID_PREFIX}${updateId}`
	const client = cma()

	// `name` is required + localized → must carry a value in every space locale.
	const fields: Record<string, any> = {
		name: Object.fromEntries(SPACE_LOCALES.map((l) => [l, listing.name])),
		city: { [DEFAULT_LOCALE]: listing.city },
		categories: {
			[DEFAULT_LOCALE]: listing.categories.map((slug) => ({
				sys: {
					type: "Link",
					linkType: "Entry",
					id: `community-category-${slug}`,
				},
			})),
		},
	}
	for (const key of ["phone", "email", "website", "address"] as const) {
		if (listing[key]) fields[key] = { [DEFAULT_LOCALE]: listing[key] }
	}

	try {
		await client.entry.createWithId(
			{ contentTypeId: "directoryEntry", entryId },
			{ fields },
		)
	} catch (err: any) {
		// Telegram redelivery → draft already exists; reuse it.
		if (!/exist|conflict|409/i.test(String(err?.message))) throw err
	}
	return entryId
}

function assertBotEntry(entryId: string) {
	// Buttons are user-controlled input: never touch anything but the bot's own drafts.
	if (!entryId.startsWith(DRAFT_ID_PREFIX)) throw new Error("Not a bot draft")
}

export async function publishDraft(entryId: string): Promise<void> {
	assertBotEntry(entryId)
	const client = cma()
	const entry = await client.entry.get({ entryId })
	await client.entry.publish({ entryId }, entry)
}

/** Deletes only if still unpublished; returns false when it was already published. */
export async function discardDraft(entryId: string): Promise<boolean> {
	assertBotEntry(entryId)
	const client = cma()
	const entry = await client.entry.get({ entryId })
	if (entry.sys.publishedVersion) return false
	await client.entry.delete({ entryId })
	return true
}
