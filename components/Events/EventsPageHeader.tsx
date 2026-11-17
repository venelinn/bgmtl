"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { PageHeader } from "@/components/PageHeader"

type EventsPageHeaderProps = {
	/** Locale prefix ("" for bg, "/en", "/fr"). */
	localePrefix: string
}

/** /events page header: shared PageHeader with the events copy and CTA. */
export function EventsPageHeader({ localePrefix }: EventsPageHeaderProps) {
	const t = useTranslations("Events")
	const tCrumbs = useTranslations("Breadcrumbs")

	return (
		<PageHeader
			crumbs={[{ label: tCrumbs("home"), href: localePrefix || "/" }, { label: t("sectionTitle") }]}
			crumbsLabel={tCrumbs("ariaLabel")}
			eyebrow={t("pageEyebrow")}
			title={t("pageTitle")}
			titleAccent={t("pageTitleAccent")}
			intro={t("pageIntro")}
			actions={
				<Button
					href={`${localePrefix}/contacts?topic=event#contact-form`}
					variant="danger"
					icon="CalendarPlus"
					label={t("suggestEvent")}
				/>
			}
		/>
	)
}
