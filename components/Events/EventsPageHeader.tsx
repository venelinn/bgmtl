"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import { Section } from "@/components/Section"
import { EventsBreadcrumb } from "./EventsBreadcrumb"
import styles from "./EventsPageHeader.module.scss"

type EventsPageHeaderProps = {
	/** Locale prefix ("" for bg, "/en", "/fr"). */
	localePrefix: string
}

/**
 * /events page header on a pale band: breadcrumb, eyebrow pill, title, intro
 * and "suggest an event".
 */
export function EventsPageHeader({ localePrefix }: EventsPageHeaderProps) {
	const t = useTranslations("Events")

	return (
		<Section size="full" padding="none" classNames={{ main: styles.band }}>
			<header className={styles.header}>
				<div className={styles.header__text}>
					<EventsBreadcrumb localePrefix={localePrefix} />
					<span className={styles.header__pill}>{t("pageEyebrow")}</span>
					<Heading as="h1" size="h1" className={styles.header__title}>
						{t("pageTitle")}
					</Heading>
					<p className={styles.header__lead}>{t("pageIntro")}</p>
					<div>
						<Button
							href={`${localePrefix}/contacts`}
							variant="danger"
							icon="CalendarPlus"
							label={t("suggestEvent")}
						/>
					</div>
				</div>

			</header>
		</Section>
	)
}
