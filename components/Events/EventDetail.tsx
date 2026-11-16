import { Button } from "@/components/Button"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { BackButton } from "@/components/Button/BackButton"
import { Icon } from "@/components/Icon"
import { Section } from "@/components/Section"
import type { EventItem } from "@/types/events"
import { slugify } from "@/utils/common"
import { FormattedDate, FormattedTime } from "@/utils/DateFormat"
import { getMessages } from "@/utils/getMessages"
import { getLocalePrefix } from "@/utils/localization"
import { renderRichTextContent } from "@/utils/RichText"
import { Heading } from "../Headings"
import { Hero } from "../Hero"
import { MapEmbed } from "./MapEmbed"
import styles from "./EventDetail.module.scss"

const DEFAULT_HERO_FALLBACK =
	"https://res.cloudinary.com/dysoiulfl/image/upload/v1772075435/ChatGPT_Image_Feb_25_2026_10_08_56_PM_ppl4ir.png"

type EventDetailProps = {
	event: EventItem
	locale: string
	/** Fallback image for hero when event has no cover (from site config fallbackEvent). */
	heroFallbackImage?: string
	/** Other upcoming dates of the same event, each linking to its own page. */
	otherDates?: { date: string; href: string }[]
}

function generateGoogleMapsURL(lat: number, lng: number, placeName?: string) {
	const query = placeName ? `${placeName} @${lat},${lng}` : `${lat},${lng}`
	return `https://www.google.com/maps?q=${encodeURIComponent(query)}`
}

export const EventDetail = ({
	event,
	locale,
	heroFallbackImage,
	otherDates = [],
}: EventDetailProps) => {
	const messages = getMessages(locale) as {
		Events?: {
			backToEvents?: string
			doorsOpenAt?: string
			buyTicket?: string
			location?: string
			otherDates?: string
			sectionTitle?: string
		}
	}
	const t = messages.Events ?? {}
	const pastEvent = new Date(event.date) < new Date()
	const heroFallback = heroFallbackImage ?? DEFAULT_HERO_FALLBACK

	// Must match the name the source event card applies on click (see Event.tsx):
	// derived from the Bulgarian heading so the cover morphs into this hero.
	const headingForSlug =
		typeof event.heading === "string"
			? event.heading
			: event.heading &&
					typeof event.heading === "object" &&
					"heading" in event.heading &&
					typeof event.heading.heading === "string"
				? event.heading.heading
				: ""
	const bgHeading = (event as { bgHeading?: string }).bgHeading || headingForSlug
	const heroTransitionName = `event-hero-${slugify(String(bgHeading || "event"))}`
	const mapHref = event.address
		? generateGoogleMapsURL(event.address.lat, event.address.lon, event.venue)
		: null
	const ticket =
		event.ticket && typeof event.ticket === "object" && "url" in event.ticket
			? (event.ticket as { url: string; name?: string; iconName?: string })
			: null

	const crumbMessages = (getMessages(locale) as { Breadcrumbs?: { home?: string; ariaLabel?: string } }).Breadcrumbs ?? {}
	const prefix = getLocalePrefix(locale)
	const crumbs = [
		{ label: crumbMessages.home ?? "Home", href: prefix || "/" },
		{ label: t.sectionTitle ?? "Events", href: `${prefix}/events` },
		{ label: String(headingForSlug || event.venue || "") },
	]

	return (
		<>
			<Hero
				images={
					event.cover?.length
						? event.cover
						: [{ src: heroFallback, url: heroFallback }]
				}
				size="full"
				viewTransitionName={heroTransitionName}
				imageAlignment="top"
				height={(event.heroHeight as "full" | "half" | "quarter") || "quarter"}
				titlePosition={
					event.heroContentPosition as
						| "center"
						| "bottom-left"
						| "bottom-center"
						| undefined
				}
				heading={
					typeof event.heading === "string"
						? {
								heading: event.heading,
								size: "hero" as const,
								as: "h1" as const,
							}
						: { ...event.heading, size: "hero" as const, as: "h1" as const }
				}
				content={event.venue}
			/>
			<Section size="small">
				<div className={styles.eventDetail}>
					<Breadcrumbs className={styles.breadcrumbs} crumbs={crumbs} ariaLabel={crumbMessages.ariaLabel} />
					<BackButton className={styles.backLink}>
						← {t.backToEvents}
					</BackButton>

					<div className={styles.eventMeta}>
						<div>
							<div className={styles.metaItem}>
								<Icon name="Calendar" />
								<strong>
									<FormattedDate
										dateStr={event.date}
										locale={locale}
										includeYear={true}
										fullFormat={true}
									/>
								</strong>
							</div>
							{!pastEvent && (
								<div className={styles.metaItem}>
									<Icon name="Clock" />
									<FormattedTime dateStr={event.date} locale={locale} />
								</div>
							)}
						</div>
						{!pastEvent && event.doorsOpen && (
							<div className={styles.metaItem}>
								<Icon name="DoorOpen" />
								{t.doorsOpenAt}{" "}
								<FormattedTime dateStr={event.doorsOpen} locale={locale} />
							</div>
						)}
						<div className={styles.metaItem}>
							{mapHref ? (
								<a
									href={mapHref}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.metaItem}
								>
									<span className="link__text">
										<Icon name="MapPin" /> {event.venue}
									</span>
								</a>
							) : (
								event.venue
							)}
						</div>

						{otherDates.length > 0 && (
							<div className={styles.metaItem}>
								<Icon name="Calendar" />
								{t.otherDates}:{" "}
								{otherDates.map((d, i) => (
									<span key={d.href}>
										{i > 0 && ", "}
										<a href={d.href}>
											<FormattedDate dateStr={d.date} locale={locale} />
										</a>
									</span>
								))}
							</div>
						)}

						{!pastEvent && ticket ? (
							<Button
								label={ticket.name || t.buyTicket}
								isExternal
								externalHref={ticket.url}
								iconAfter={ticket.iconName}
								className={styles.ticketLink}
								variant="secondary"
							/>
						) : null}
					</div>

					{event.content ? (
						<div className={styles.event__description}>
							{renderRichTextContent(event.content as object)}
						</div>
					) : null}
				</div>
			</Section>
			{event.address && (
				<>
					<Section size="small" paddingControl="removeTop">
						<Heading
							as="h2"
							size="h4"
							icon="MapPin"
							highlight
							className={styles.mapContainer__title}
						>
							{t.location}: {event.venue}
						</Heading>
					</Section>
					<Section size="full-max" padding="none">
						<div className={styles.mapContainer}>
							<MapEmbed
								src={`https://maps.google.com/maps?q=${event.address.lat},${event.address.lon}&output=embed`}
								title={`Map location for ${event.venue || "event"}`}
							/>
						</div>
					</Section>
				</>
			)}
		</>
	)
}
