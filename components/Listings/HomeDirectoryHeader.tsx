"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import styles from "./HomeEventsHeader.module.scss"

type HomeDirectoryHeaderProps = {
	href: string
	showViewAll?: boolean
}

/**
 * Homepage "Community Directory" header: title on the left, "View all" link on
 * the same line to the right. Shares the events-header layout styles.
 */
export function HomeDirectoryHeader({
	href,
	showViewAll = false,
}: HomeDirectoryHeaderProps) {
	const t = useTranslations("Directory")

	return (
		<div className={styles.header}>
			<Heading as="h2" size="h3" className={styles.header__title}>
				<Icon name="BookUser" />
				{t("sectionTitle")}
			</Heading>
			{showViewAll && (
				<Button
					href={href}
					variant="link"
					label={t("viewAll")}
					size="sm"
					iconAfter="ArrowRight"
				/>
			)}
		</div>
	)
}
