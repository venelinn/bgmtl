import { Event } from "@/components/Events/Event"
import type { EventItem } from "@/types/events"
import { getFallbackImageUrl, getListingsData } from "@/utils/content"
import { getLocalePrefix } from "@/utils/localization"
import { HomeSectionHeader } from "./HomeSectionHeader"
import { Section } from "@/components/Section"

type HomeEventsConnectorProps = {
	locale: string
	limit?: number
	preview?: boolean
}

/**
 * Homepage events teaser: a flat list of events (no Upcoming/Past sub-headings)
 * under a single "Events" header with an inline "View all events" link.
 * The dedicated /events page keeps the grouped Upcoming/Past layout.
 */
export async function HomeEventsConnector({
	locale,
	limit = 3,
	preview = false,
}: HomeEventsConnectorProps) {
	const { sections, siteConfig } = await getListingsData(["events"], locale, {
		limit,
		preview,
	})
	const section = sections.find((s) => s.type === "events")
	if (!section?.cards.length) return null

	const fallbackImage =
		getFallbackImageUrl(siteConfig?.fallbackEvents) ?? undefined
	const today = new Date()
	const cards = section.cards as unknown as EventItem[]

	return (
		<Section padding="none">
			<HomeSectionHeader
				icon="PartyPopper"
				namespace="Events"
				href={`${getLocalePrefix(locale)}/events`}
				showViewAll
			/>
			{/* A plain list: the cards space themselves (Event.module.scss). */}
			{cards.map((event) => (
				<Event
					key={event.id}
					event={event}
					type={new Date(event.date) > today ? "upcoming" : "past"}
					locale={locale}
					fallbackImage={fallbackImage}
				/>
			))}
		</Section>
	)
}
