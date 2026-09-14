"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/Button"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import styles from "./HomeSectionHeader.module.scss"

/** Message namespace the title and "view all" label are read from. */
export type SectionNamespace = "Events" | "Directory" | "News"

type HomeSectionHeaderProps = {
	/** Lucide icon name shown before the title. */
	icon: string
	namespace: SectionNamespace
	href: string
	showViewAll?: boolean
	/** Title key within `namespace`. News reads "latestNews", the rest "sectionTitle". */
	titleKey?: string
}

/**
 * The homepage listing-section header: icon + title on the left, a "view all"
 * link on the same line to the right.
 *
 * One component for every listing section (events, directory, news) so they
 * cannot drift apart — this was three near-identical copies, and news had a
 * fourth, different header that rendered grey and unbracketed next to the other
 * two. Adding a section means passing an icon and a namespace, not copying a file.
 */
export function HomeSectionHeader({
	icon,
	namespace,
	href,
	showViewAll = false,
	titleKey = "sectionTitle",
}: HomeSectionHeaderProps) {
	const t = useTranslations(namespace)

	return (
		<div className={styles.header}>
			<Heading as="h2" size="h3" className={styles.header__title}>
				<Icon name={icon} />
				{t(titleKey)}
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
