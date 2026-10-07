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

export type Localized = Record<string, string>

export type ParsedListing = {
	/** Display name (used for the preview + duplicate check). */
	name: string
	/** Name per space locale (always all three). */
	names: Localized
	/** Optional note per space locale (all three when present). */
	notes?: Localized
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
Name EN: Roza Bulgarian Bakery
Category: food
City: montreal
Phone: 514-555-0100
Email: info@roza.ca
Website: https://roza.ca
Address: 123 Rue Saint-Denis, Montréal
Note: Отворено всеки ден 8–18
Note EN: Open daily 8–18`

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
	note: "note",
	бележка: "note",
	забележка: "note",
}

const CITY_ALIASES: Record<string, string> = {
	монреал: "montreal",
	montréal: "montreal",
}

// "name"/"note" (+ Bulgarian synonyms) with an optional language suffix.
const NAME_KEYS = new Set(["name", "име"])
const LOCALIZED_KEY_RE = /^(name|име|note|бележка|забележка) (bg|en|fr|бг)$/
const LOCALE_BY_SUFFIX: Record<string, string> = {
	bg: "bg-BG",
	бг: "bg-BG",
	en: "en-CA",
	fr: "fr-CA",
}

/**
 * All three locales from whatever was provided, so required localized fields are
 * never empty. An explicit "<field> XX" value always wins; otherwise
 * bg/en use the plain "<field>" value, and fr prefers the EN text (existing
 * entries use the Latin text for fr) before the plain value.
 */
function fillLocales(f: Record<string, string>, field: string): Localized {
	const plain =
		f[field] ??
		f[`${field}:en-CA`] ??
		f[`${field}:bg-BG`] ??
		f[`${field}:fr-CA`]
	return {
		"bg-BG": f[`${field}:bg-BG`] ?? plain,
		"en-CA": f[`${field}:en-CA`] ?? plain,
		"fr-CA": f[`${field}:fr-CA`] ?? f[`${field}:en-CA`] ?? plain,
	}
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
		const key = m?.[1].trim().toLowerCase().replace(/[-_]/g, " ")
		const lm = key?.match(LOCALIZED_KEY_RE)
		const field = key && KEYS[key]
		if (lm && m) {
			// "Name EN: …" / "Note bg: …" → per-locale value
			const base = NAME_KEYS.has(lm[1]) ? "name" : "note"
			const loc = LOCALE_BY_SUFFIX[lm[2].toLowerCase()]
			f[`${base}:${loc}`] ||= m[2].trim()
		} else if (field && m) {
			f[field] ||= m[2].trim()
		} else if (EMAIL_RE.test(line) && !f.email) {
			f.email = line.match(EMAIL_RE)?.[0] as string
		} else if (URL_RE.test(line) && !f.website) {
			f.website = line.match(URL_RE)?.[0] as string
		} else if (!f.name && !SPACE_LOCALES.some((l) => f[`name:${l}`])) {
			f.name = line
		} else {
			leftovers.push(line)
		}
	}

	if (!f.name && !SPACE_LOCALES.some((l) => f[`name:${l}`]))
		throw new Error("I need at least a name. Send /new for the format.")
	const names = fillLocales(f, "name")
	const notes =
		f.note || SPACE_LOCALES.some((l) => f[`note:${l}`])
			? fillLocales(f, "note")
			: undefined

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
		name: names["en-CA"],
		names,
		notes,
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
	excludeEntryId?: string,
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
		.filter((e: any) => e.sys.id !== excludeEntryId)
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
		name: listing.names,
		city: { [DEFAULT_LOCALE]: listing.city },
		categories: {
			[DEFAULT_LOCALE]: categoryLinks(listing.categories),
		},
	}
	if (listing.notes) fields.note = listing.notes
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

const categoryLinks = (slugs: string[]) =>
	slugs.map((slug) => ({
		sys: { type: "Link", linkType: "Entry", id: `community-category-${slug}` },
	}))

export type DraftPatch = Partial<
	Pick<ParsedListing, "categories" | "phone" | "email" | "website" | "address">
> & {
	/** Merged into the existing per-locale values (only the given locales change). */
	names?: Localized
	notes?: Localized
	/** Add the category if absent, remove it if present (atomic w.r.t. rapid taps). */
	toggleCategory?: string
}

const NOT_FOUND_MSG =
	"That listing no longer exists (discarded?). Send /add to start again."

async function getOpenDraft(entryId: string) {
	assertBotEntry(entryId)
	const client = cma()
	const entry = await client.entry.get({ entryId }).catch(() => {
		throw new Error(NOT_FOUND_MSG)
	})
	if (entry.sys.publishedVersion)
		throw new Error(
			"That listing is already published. Send /add for a new one.",
		)
	return { client, entry }
}

/**
 * Merge answers into an UNPUBLISHED bot draft (step-by-step /add flow).
 * Re-reads and retries on a version conflict, so quick successive taps
 * (e.g. several category buttons) can't clobber each other.
 * Returns the draft's resulting category slugs.
 */
export async function updateDraft(
	entryId: string,
	patch: DraftPatch,
): Promise<string[]> {
	for (let attempt = 0; ; attempt++) {
		const { client, entry } = await getOpenDraft(entryId)
		const f = entry.fields as Record<string, any>
		if (patch.names) f.name = { ...f.name, ...patch.names }
		if (patch.notes) f.note = { ...f.note, ...patch.notes }

		let categories: string[] = (
			(f.categories?.[DEFAULT_LOCALE] ?? []) as any[]
		).map((l) => String(l.sys.id).replace(/^community-category-/, ""))
		if (patch.categories) categories = patch.categories
		if (patch.toggleCategory) {
			const slug = patch.toggleCategory
			categories = categories.includes(slug)
				? categories.filter((c) => c !== slug)
				: [...categories, slug]
		}
		if (patch.categories || patch.toggleCategory)
			f.categories = { [DEFAULT_LOCALE]: categoryLinks(categories) }

		for (const key of ["phone", "email", "website", "address"] as const) {
			if (patch[key]) f[key] = { [DEFAULT_LOCALE]: patch[key] }
		}
		try {
			await client.entry.update({ entryId }, entry)
			return categories
		} catch (err: any) {
			if (
				attempt < 3 &&
				/VersionMismatch|409|version/i.test(String(err?.message))
			)
				continue
			throw err
		}
	}
}

/** Read a draft back as a listing (for the preview). */
export async function getDraft(entryId: string): Promise<ParsedListing> {
	const { entry } = await getOpenDraft(entryId)
	const f = entry.fields as Record<string, any>
	const v = (k: string) => f[k]?.[DEFAULT_LOCALE] as string | undefined
	const names = f.name as Localized
	return {
		name: names["en-CA"] ?? Object.values(names)[0],
		names,
		notes: f.note,
		city: v("city") ?? "montreal",
		categories: ((f.categories?.[DEFAULT_LOCALE] ?? []) as any[]).map((l) =>
			String(l.sys.id).replace(/^community-category-/, ""),
		),
		unknownCategories: [],
		phone: v("phone"),
		email: v("email"),
		website: v("website"),
		address: v("address"),
	}
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
