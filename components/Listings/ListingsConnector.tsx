import type { CollectionConnectorProps } from "@/components/Collection"
import { CollectionConnector } from "@/components/Collection"
import { getFallbackImageUrl, getListingsData } from "@/utils/content"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { ViewAllLink } from "./ViewAllLink"

export type ListingType = "events" | "news"

type ListingsConnectorProps = {
	listings: ListingType[]
	locale: string
	limit?: number
	preview?: boolean
}

/**
 * Fetches listing data from Contentful based on Page model "listings" field.
 * Uses site config for limits (listingEvents, listingNews) and fallback images.
 */
export async function ListingsConnector({
	listings,
	locale,
	limit = 3,
	preview = false,
}: ListingsConnectorProps) {
	if (!listings?.length) return null

	const { sections, siteConfig } = await getListingsData(listings, locale, {
		limit,
		preview,
	})
	if (!sections.length) return null

	const fallbackEventsImage =
		getFallbackImageUrl(siteConfig?.fallbackEvents) ?? undefined
	const fallbackNewsImage =
		getFallbackImageUrl(siteConfig?.fallbackNews) ?? undefined

	return (
		<>
			{sections.map((section) => (
				<ListingsSection
					key={section.type}
					section={section}
					locale={locale}
					fallbackImage={
						section.type === "events" ? fallbackEventsImage : fallbackNewsImage
					}
				/>
			))}
		</>
	)
}

function ListingsSection({
	section,
	locale,
	fallbackImage,
}: {
	section: { type: "events" | "news"; cards: unknown[]; hasMore: boolean }
	locale: string
	fallbackImage?: string
}) {
	if (!section.cards.length) return null

	const cards = section.cards as NonNullable<CollectionConnectorProps["cards"]>
	const cardVariant = section.type === "events" ? "event" : "news"
	const namespace = section.type === "events" ? "Events" : "News"
	const href = `/${locale}/${section.type}`

	// News gets the same icon + inline "view all" header the homepage sections
	// use. Events don't: `CollectionConnector` splits them into Upcoming/Past
	// sub-headings, so a section header above that would attach to the wrong
	// list — they keep the centred link underneath instead.
	if (section.type === "news") {
		return (
			<>
				<HomeSectionHeader
					icon="Newspaper"
					namespace="News"
					titleKey="latestNews"
					href={href}
					showViewAll={section.hasMore}
				/>
				<CollectionConnector
					cards={cards}
					cardVariant={cardVariant}
					locale={locale}
					variant="grid"
					itemsPerRow={1}
					fallbackImage={fallbackImage}
				/>
			</>
		)
	}

	return (
		<>
			<CollectionConnector
				cards={cards}
				cardVariant={cardVariant}
				locale={locale}
				variant="grid"
				itemsPerRow={1}
				fallbackImage={fallbackImage}
			/>
			{section.hasMore && (
				<div className="mt-4 text-center">
					<ViewAllLink href={href} namespace={namespace} />
				</div>
			)}
		</>
	)
}
