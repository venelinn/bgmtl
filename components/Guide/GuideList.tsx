"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"
import { Alert } from "@/components/Alert"
import type { ItemsPerRow } from "@/components/Collection/CollectionConnector"
import { GridCollection } from "@/components/Collection/Grid/GridCollection"
import styles from "./GuideList.module.scss"

export type GuideListItem = {
	id: string
	/** Card topic (Contentful `card.role`); one filter chip per distinct topic. */
	topic?: string
	/** Category colour (1–6) for this item's chip. */
	tone?: number
	content: ReactNode
}

type GuideListProps = {
	id?: string
	items: GuideListItem[]
	itemsPerRow?: ItemsPerRow
}

const ALL = "__all"

/**
 * The full newcomer guide: a "check the official sites" notice, quick topic
 * filters and the card grid. Cards are rendered on the server and passed in;
 * this only filters them.
 */
export function GuideList({ id, items, itemsPerRow = 3 }: GuideListProps) {
	const t = useTranslations("Guide")
	const [topic, setTopic] = useState(ALL)

	const topics = [...new Set(items.map((item) => item.topic).filter(Boolean))] as string[]
	const toneOf = (value: string) => items.find((item) => item.topic === value)?.tone
	const visible = topic === ALL ? items : items.filter((item) => item.topic === topic)

	return (
		<div className={styles.guide}>
			<Alert title={t("noticeTitle")}>{t("notice")}</Alert>
			{topics.length > 1 && (
				<ul className={styles.guide__chips} aria-label={t("filterAriaLabel")}>
					{[ALL, ...topics].map((value) => (
						<li key={value}>
							<button
								type="button"
								className={styles.guide__chip}
								aria-pressed={topic === value}
								data-tone={value === ALL ? undefined : toneOf(value)}
								onClick={() => setTopic(value)}
							>
								{value === ALL ? t("all") : value}
							</button>
						</li>
					))}
				</ul>
			)}
			<GridCollection id={id} items={visible} itemsPerRow={itemsPerRow} />
		</div>
	)
}
