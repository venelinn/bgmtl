"use client"

import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { ViewTransition } from "@/components/ViewTransition"
import { EVENT_TAGS, type EventProps } from "@/types/events"
import { getEventPermalink, slugify } from "@/utils/common"
import { FormattedDate, FormattedTime } from "@/utils/DateFormat"
import { renderRichTextContent } from "@/utils/RichText"
import { Heading } from "../Headings"
import styles from "./Event.module.scss"

function generateGoogleMapsURL(lat: number, lng: number, placeName?: string) {
	const query = placeName ? `${placeName} @${lat},${lng}` : `${lat},${lng}`
	return `https://www.google.com/maps?q=${encodeURIComponent(query)}`
}

const DEFAULT_FALLBACK_IMAGE =
	"https://res.cloudinary.com/dysoiulfl/image/upload/v1770477066/ORBF_logo_small_dnaxwz.jpg"

export const Event = ({ event, type, locale, fallbackImage }: EventProps) => {
	const t = useTranslations()
	const [imageError, setImageError] = useState(false)
	const effectiveFallback = fallbackImage ?? DEFAULT_FALLBACK_IMAGE

	const hasCover = !!event.cover?.[0]
	const cover = event.cover?.[0] ?? {
		src: effectiveFallback,
		alt: "Event cover",
		width: 507,
		height: 86,
	}
	const isFallback = !hasCover || imageError

	const headingText =
		typeof event.heading === "string"
			? event.heading
			: event.heading &&
					typeof event.heading === "object" &&
					"heading" in event.heading
				? event.heading.heading
				: ""

	const bulgarianHeading =
		(event as { bgHeading?: string }).bgHeading || headingText
	const eventDetailHref = getEventPermalink({
		locale,
		title: bulgarianHeading ? String(bulgarianHeading) : "event",
	})

	// Shared-element view transition: the cover and the detail-page hero share this
	// name, so React morphs one into the other on navigation. Keyed by the same
	// slug that builds the URL, so the detail page derives an identical name.
	const heroTransitionName = `event-hero-${slugify(
		String(bulgarianHeading || "event"),
	)}`
	const mapHref = event.address
		? generateGoogleMapsURL(event.address.lat, event.address.lon, event.venue)
		: null
	const price = event.price ? String(event.price) : null
	const ticket =
		type === "upcoming" &&
		event.ticket &&
		typeof event.ticket === "object" &&
		"url" in event.ticket
			? (event.ticket as { url: string; name?: string; iconName?: string })
			: null

	// Unknown values (e.g. a tag removed from the model) are skipped, not shown raw.
	const tags = (event.tags ?? []).filter((tag) =>
		(EVENT_TAGS as readonly string[]).includes(tag),
	)

	return (
		<article className={styles.event} key={event.id} data-type={type}>
			<div className={styles.event__inner}>
				<figure className={styles.event__image}>
					<Link
						href={eventDetailHref}
						title={String(headingText) ?? "Event cover"}
						className={styles.event__imageLink}
					>
						<ViewTransition
							name={heroTransitionName}
							share="morph"
							default="none"
						>
							<Image
								src={cover.src}
								alt={String(headingText) ?? "Event cover"}
								width={cover.width}
								height={cover.height}
								sizes="(max-width: 48rem) 100vw, 360px"
								className={clsx(isFallback && styles.event__imageFallback)}
								onError={() => setImageError(true)}
							/>
						</ViewTransition>
					</Link>
					{tags.length > 0 && (
						<ul className={styles.event__tags}>
							{tags.map((tag) => (
								<li key={tag} className={styles.event__tag} data-tag={tag}>
									{t(`Events.tags.${tag}`)}
								</li>
							))}
						</ul>
					)}
				</figure>

				<div className={styles.event__details}>
					<div className={styles.event__header}>
						<strong className={styles.event__date}>
							<Icon name="Calendar" size={16} />
							<FormattedDate
								dateStr={event.date}
								locale={locale}
								fullFormat="long"
							/>
						</strong>
						<span className={styles.event__time}>
							<Icon name="Clock" size={16} />
							<FormattedTime dateStr={event.date} locale={locale} />
						</span>
					</div>

					<Heading as="h3" size="h3" className={styles.event__title}>
						<Link href={eventDetailHref} className={styles.event__titleLink}>
							{String(headingText || event.venue || "")}
						</Link>
					</Heading>

					{event.excerpt && (
						<div className={styles.event__excerpt}>
							{
								renderRichTextContent(
									event.excerpt as object,
								) as React.ReactNode
							}
						</div>
					)}

					{event.venue && (
						<div className={styles.event__location}>
							<Icon name="MapPin" size={16} />
							{mapHref ? (
								<a
									href={mapHref}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.event__mapLink}
								>
									{event.venue}
								</a>
							) : (
								event.venue
							)}
						</div>
					)}

					<div className={styles.event__actions}>
						{price && <span className={styles.event__price}>{price}</span>}
						{ticket && (
							<Button
								isExternal
								externalHref={ticket.url}
								icon={ticket.iconName || "Ticket"}
								variant="secondary"
								size="sm"
								label={ticket.name || t("Events.buyTicket")}
							/>
						)}
						<Button
							href={eventDetailHref}
							variant="secondary"
							size="sm"
							iconAfter="ArrowRight"
							label={
								ticket ? t("Events.detailsAndLocation") : t("Events.readMore")
							}
							className={styles.event__more}
						/>
					</div>
				</div>
			</div>
		</article>
	)
}
