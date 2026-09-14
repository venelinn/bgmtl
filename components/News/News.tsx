"use client"

import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import type React from "react"
import { useState } from "react"
import { Icon } from "@/components/Icon"
import { ViewTransition } from "@/components/ViewTransition"
import type { NewsProps } from "@/types/news"
import { getNewsPermalink, slugify } from "@/utils/common"
import { FormattedDate } from "@/utils/DateFormat"
import { renderRichTextContent } from "@/utils/RichText"
import { Heading } from "../Headings"
import styles from "./News.module.scss"

const DEFAULT_FALLBACK_IMAGE =
	"https://res.cloudinary.com/dysoiulfl/image/upload/v1770477066/ORBF_logo_small_dnaxwz.jpg"

export const News = ({ news, locale, fallbackImage }: NewsProps) => {
	const t = useTranslations("News")
	const [imageError, setImageError] = useState(false)
	const effectiveFallback = fallbackImage ?? DEFAULT_FALLBACK_IMAGE

	const hasCover = !!news.cover?.[0]
	const cover = news.cover?.[0] ?? {
		src: effectiveFallback,
		alt: "News cover",
		width: 507,
		height: 86,
	}
	const isFallback = !hasCover || imageError

	const headingText =
		typeof news.heading === "string"
			? news.heading
			: news.heading &&
					typeof news.heading === "object" &&
					"heading" in news.heading
				? news.heading.heading
				: ""

	const bulgarianHeading =
		(news as { bgHeading?: string }).bgHeading || headingText
	const newsDetailHref = getNewsPermalink({
		locale,
		title: bulgarianHeading ? String(bulgarianHeading) : "news",
	})

	// Shared-element view transition: the cover and the detail-page hero share
	// this name, so React morphs one into the other on navigation. Keyed by the
	// same slug that builds the URL, so the detail page derives an identical
	// name. Mirrors `event-hero-*` in Event.tsx / EventDetail.tsx.
	const heroTransitionName = `news-hero-${slugify(String(bulgarianHeading || "news"))}`

	return (
		<article className={styles.news} key={news.id}>
			<div className={styles.news__details}>
				<Heading as="h3" size="h3" highlight className={styles.news__title}>
					<Link href={newsDetailHref} className={styles.news__titleLink}>
						{String(headingText || "News")}
					</Link>
				</Heading>
				<div className={styles.news__header}>
					<strong className={styles.news__date}>
						<Icon name="Calendar" size={14} />
						<FormattedDate
							dateStr={news.date}
							locale={locale}
							includeYear={true}
						/>
					</strong>
				</div>

				{news.excerpt ? (
					<div className={styles.news__excerpt}>
						{renderRichTextContent(news.excerpt as object) as React.ReactNode}
						<Link href={newsDetailHref} className={clsx(styles.link, "link")}>
							<span className="link__text">
								{t("readMore")} <Icon name="ArrowRight" />
							</span>
						</Link>
					</div>
				) : null}
			</div>
			<figure className={styles.news__image}>
				<Link
					href={newsDetailHref}
					title={String(headingText) ?? "News cover"}
					className={styles.news__imageLink}
				>
					<ViewTransition
						name={heroTransitionName}
						share="morph"
						default="none"
					>
						<Image
							src={cover.src}
							alt={String(headingText) ?? "News cover"}
							width={cover.width}
							height={cover.height}
							sizes="(max-width: 48rem) 100vw, 280px"
							className={clsx(isFallback && styles.news__imageFallback)}
							onError={() => setImageError(true)}
						/>
					</ViewTransition>
				</Link>
			</figure>
		</article>
	)
}
