import type { EventItem } from "@/types/events"
import type { NewsItem } from "@/types/news"
import { getOgImageUrl, slugify } from "@/utils/common"
import { localization } from "@/utils/localization"

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://bgmtl.com").replace(/\/+$/, "")
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "bgmtl.com"
// Ottawa-Gatineau community → tickets are priced in Canadian dollars.
const PRICE_CURRENCY = "CAD"

function headingText(heading: EventItem["heading"], fallback?: string): string {
	if (typeof heading === "string") return heading
	if (heading && typeof heading === "object" && "heading" in heading && typeof heading.heading === "string") {
		return heading.heading
	}
	return fallback || ""
}

/** Flatten a Contentful rich-text document (or plain string) to a single text line. */
function richTextToPlainText(content: unknown): string {
	if (!content) return ""
	if (typeof content === "string") return content.replace(/\s+/g, " ").trim()
	const walk = (nodes: unknown): string => {
		if (!Array.isArray(nodes)) return ""
		return nodes
			.map((n) => {
				const node = n as { nodeType?: string; value?: string; content?: unknown }
				if (node.nodeType === "text") return node.value || ""
				if (Array.isArray(node.content)) return walk(node.content)
				return ""
			})
			.join("")
	}
	const doc = content as { content?: unknown }
	return walk(doc.content).replace(/\s+/g, " ").trim()
}

/** Best-effort parse of a numeric "lowest" price out of free-text like "From $49" / "49 CAD". */
function parsePrice(price?: string): string | null {
	if (!price) return null
	const match = price.replace(/,/g, "").match(/\d+(?:\.\d+)?/)
	return match ? match[0] : null
}

function localePrefix(locale: string): string {
	return locale && locale !== localization.defaultLocale ? `/${locale}` : ""
}

/**
 * Slug for an event/news detail URL. Derived from the Bulgarian heading so it is
 * identical across locales — must stay in sync with the `generateStaticParams` /
 * detail-page matchers in `app/[lang]/events|news/[...slug]/page.tsx`.
 */
function detailSlug(item: { heading: EventItem["heading"]; bgHeading?: string }, fallback: string): string {
	const bgHeading = item.bgHeading || headingText(item.heading)
	return slugify(String(bgHeading || fallback))
}

/** A schema.org Event object WITHOUT `@context` — reusable as a standalone node or inside an ItemList. */
function eventNode(event: EventItem, locale: string): Record<string, unknown> {
	const name = headingText(event.heading, event.venue) || "Event"
	const coverUrl = event.cover?.[0]?.src ?? null
	const image = coverUrl ? getOgImageUrl(coverUrl) : null
	const description =
		richTextToPlainText(event.excerpt) || richTextToPlainText(event.content) || `Event at ${event.venue ?? name}`
	const slug = detailSlug(event as EventItem & { bgHeading?: string }, "event")
	const url = `${BASE_URL}${localePrefix(locale)}/events/${slug}`

	const node: Record<string, unknown> = {
		"@type": "Event",
		name,
		startDate: event.date,
		eventStatus: "https://schema.org/EventScheduled",
		eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
		description,
		url,
		organizer: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
	}

	if (event.doorsOpen) node.doorTime = event.doorsOpen
	if (image) node.image = [image]

	if (event.venue || event.address) {
		const place: Record<string, unknown> = { "@type": "Place", name: event.venue || name }
		if (event.address) {
			place.geo = {
				"@type": "GeoCoordinates",
				latitude: event.address.lat,
				longitude: event.address.lon,
			}
		}
		node.location = place
	}

	const ticket =
		event.ticket && typeof event.ticket === "object" && "url" in event.ticket
			? (event.ticket as { url: string })
			: null
	const price = parsePrice(event.price)
	if (ticket || price) {
		const offer: Record<string, unknown> = { "@type": "Offer", availability: "https://schema.org/InStock" }
		if (ticket) offer.url = ticket.url
		if (price) {
			offer.price = price
			offer.priceCurrency = PRICE_CURRENCY
		}
		node.offers = offer
	}

	return node
}

/**
 * schema.org Event for an event DETAIL page.
 * Google Event rich-results docs: https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function buildEventJsonLd(event: EventItem, locale: string): Record<string, unknown> {
	return { "@context": "https://schema.org", ...eventNode(event, locale) }
}

/**
 * schema.org ItemList of Events for the events LISTING page — makes the index
 * crawl-friendly and eligible for the event list/carousel treatment. Each item is
 * a full Event node so Google has the details without crawling every detail page.
 */
export function buildEventsItemListJsonLd(events: EventItem[], locale: string): Record<string, unknown> {
	return {
		"@context": "https://schema.org",
		"@type": "ItemList",
		itemListElement: events.map((event, i) => ({
			"@type": "ListItem",
			position: i + 1,
			item: eventNode(event, locale),
		})),
	}
}

/**
 * schema.org NewsArticle for a news DETAIL page.
 * Google Article rich-results docs: https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function buildArticleJsonLd(news: NewsItem, locale: string): Record<string, unknown> {
	const name = headingText(news.heading) || "News"
	// Google recommends headline ≤ 110 chars.
	const headline = name.length > 110 ? `${name.slice(0, 107)}…` : name
	const coverUrl = news.cover?.[0]?.src ?? null
	const image = coverUrl ? getOgImageUrl(coverUrl) : null
	const description = richTextToPlainText(news.excerpt) || richTextToPlainText(news.content) || name
	const slug = detailSlug(news as NewsItem & { bgHeading?: string }, "news")
	const url = `${BASE_URL}${localePrefix(locale)}/news/${slug}`
	const modified = (news._updatedAt as string) || news.date

	const data: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "NewsArticle",
		headline,
		description,
		datePublished: news.date,
		dateModified: modified,
		mainEntityOfPage: { "@type": "WebPage", "@id": url },
		url,
		author: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
		publisher: { "@type": "Organization", name: SITE_NAME, url: BASE_URL },
	}

	if (image) data.image = [image]

	return data
}
