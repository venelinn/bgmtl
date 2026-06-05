"use client"

import { useTranslations } from "next-intl"
import eventsStyles from "@/components/Events/Events.module.scss"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"

type ListingsSectionHeadingProps = {
	type: "events" | "news"
}

export function ListingsSectionHeading({ type }: ListingsSectionHeadingProps) {
	const t = useTranslations(type === "events" ? "Events" : "News")
	const title = type === "news" ? t("latestNews") : t("sectionTitle")
	return (
		<Heading
			as="h2"
			size="sb"
			className={type === "news" ? "mt-8" : eventsStyles.events__heading}
		>
			{type === "events" && <Icon name="Guitar" />}
			{title}
		</Heading>
	)
}
