"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type React from "react"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import { EVENT_TAGS, type EventItem } from "@/types/events"
import { getEventPermalink } from "@/utils/common"
import { FormattedDate, FormattedTime } from "@/utils/DateFormat"
import { renderRichTextContent } from "@/utils/RichText"
import styles from "./EventArchiveCard.module.scss"

type EventArchiveCardProps = {
	event: EventItem
	locale: string
}

/**
 * Compact, image-less card for the past-events archive grid on /events:
 * "past" badge + date, title, short excerpt, venue, first tag and a read-more link.
 */
export function EventArchiveCard({ event, locale }: EventArchiveCardProps) {
	const t = useTranslations("Events")

	const headingText =
		typeof event.heading === "string" ? event.heading : (event.heading?.heading ?? "")
	const bulgarianHeading = (event as { bgHeading?: string }).bgHeading || headingText
	const href = getEventPermalink({
		locale,
		title: bulgarianHeading ? String(bulgarianHeading) : "event",
	})
	const tag = (event.tags ?? []).find((tg) => (EVENT_TAGS as readonly string[]).includes(tg))

	return (
		<article className={styles.archive}>
			<div className={styles.archive__top}>
				<span className={styles.archive__badge}>{t("pastBadge")}</span>
				<span className={styles.archive__date}>
					<Icon name="Calendar" size={14} />
					<FormattedDate dateStr={event.date} locale={locale} />
					<span aria-hidden="true">·</span>
					<FormattedTime dateStr={event.date} locale={locale} />
				</span>
			</div>

			<Heading as="h3" size="h4" className={styles.archive__title}>
				<Link href={href} className={styles.archive__titleLink}>
					{String(headingText || event.venue || "")}
				</Link>
			</Heading>

			{event.excerpt && (
				<div className={styles.archive__excerpt}>
					{renderRichTextContent(event.excerpt as object) as React.ReactNode}
				</div>
			)}

			{event.venue && (
				<p className={styles.archive__venue}>
					<Icon name="MapPin" size={14} />
					<span>{event.venue}</span>
				</p>
			)}

			<div className={styles.archive__footer}>
				<span className={styles.archive__tag}>{tag ? t(`tags.${tag}`) : ""}</span>
				<Link href={href} className={styles.archive__more}>
					{t("readMore")}
					<Icon name="ArrowRight" size={16} strokeWidth="1.8" />
				</Link>
			</div>
		</article>
	)
}
