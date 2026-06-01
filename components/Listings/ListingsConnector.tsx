import type { CollectionConnectorProps } from "@/components/Collection"
import { CollectionConnector } from "@/components/Collection"
import { getFallbackImageUrl, getListingsData } from "@/utils/content"
import { ListingsSectionHeading } from "./ListingsSectionHeading"
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

	return (
		<section>
			{section.type === "news" && <ListingsSectionHeading type="news" />}
			<CollectionConnector
				cards={cards}
				cardVariant={cardVariant}
				locale={locale}
				variant="grid"
				itemsPerRow={cardVariant === "news" ? 1 : 1}
				fallbackImage={fallbackImage}
			/>
			{section.hasMore && (
				<div className="mt-4 text-center">
					<ViewAllLink href={href} namespace={namespace} />
				</div>
			)}
		</section>
	)
}
