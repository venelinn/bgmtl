"use client"

import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Button } from "@/components/Button"
import { GridCollection } from "@/components/Collection"
import { DirectoryCard } from "@/components/Directory/DirectoryCard"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import { Section } from "@/components/Section"
import type { DirectoryData } from "@/utils/content"
import styles from "./HomeDirectory.module.scss"

export type HomeDirectoryProps = {
	items: DirectoryData["items"]
	categories: DirectoryData["categories"]
	/** Locale-prefixed path of the full directory, e.g. "/en/community". */
	directoryPath: string
	/** Locale-prefixed contacts page — where "add your business" leads. */
	contactsPath: string
	/** Cards shown at once (newest first). */
	limit?: number
	/** Category tabs after "All", picked by listing count. */
	tabCount?: number
}

const ALL = "__all"

/**
 * Homepage community-directory section: pale band with a header, category tabs
 * (real counts) that filter the newest listings in place, a grid of cards and an
 * "add your business" banner. The full filterable directory lives at /community.
 */
export function HomeDirectory({
	items,
	categories,
	directoryPath,
	contactsPath,
	limit = 6,
	tabCount = 5,
}: HomeDirectoryProps) {
	const t = useTranslations("Directory")
	const [active, setActive] = useState(ALL)

	const labelBySlug = useMemo(
		() => new Map(categories.map((c) => [c.slug, c.label])),
		[categories],
	)

	// Tabs: the categories with the most listings (ties by label), with counts.
	const tabs = useMemo(() => {
		const counts = new Map<string, number>()
		for (const item of items) {
			for (const slug of item.categorySlugs) {
				counts.set(slug, (counts.get(slug) ?? 0) + 1)
			}
		}
		return [...counts.entries()]
			.filter(([slug]) => labelBySlug.has(slug))
			.map(([slug, count]) => ({ slug, count, label: labelBySlug.get(slug) as string }))
			.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
			.slice(0, tabCount)
	}, [items, labelBySlug, tabCount])

	const visible = useMemo(
		() =>
			(active === ALL ? items : items.filter((it) => it.categorySlugs.includes(active))).slice(
				0,
				limit,
			),
		[items, active, limit],
	)

	const cards = visible.map((item) => ({
		id: item.id,
		content: (
			<DirectoryCard
				key={item.id}
				tags={item.categorySlugs.map((slug) => ({
					label: labelBySlug.get(slug) ?? slug,
					href: `${directoryPath}/${slug}`,
				}))}
				title={item.title}
				logo={item.logo}
				address={item.address}
				phone={item.phone}
				email={item.email}
				website={item.website}
				note={item.note}
			/>
		),
	}))

	const tabButton = (slug: string, label: string, count: number) => (
		<li key={slug}>
			<button
				type="button"
				className={styles.directory__tab}
				aria-pressed={active === slug}
				onClick={() => setActive(slug)}
			>
				{label} <span className={styles.directory__count}>({count})</span>
			</button>
		</li>
	)

	return (
		<Section size="full" padding="large" classNames={{ main: styles.directory }}>
			<header className={styles.directory__header}>
				<div className={styles.directory__intro}>
					<span className={styles.directory__eyebrow}>
						<Icon name="BookUser" size={16} strokeWidth="1.8" />
						{t("homeEyebrow")}
					</span>
					<Heading as="h2" size="h2" className={styles.directory__title}>
						{t("homeTitle")}
					</Heading>
					<p className={styles.directory__lead}>{t("homeIntro")}</p>
				</div>
				<Button
					href={contactsPath}
					variant="secondary"
					icon="Plus"
					label={t("addListing")}
				/>
			</header>

			<ul className={styles.directory__tabs} aria-label={t("filterAriaLabel")}>
				{tabButton(ALL, t("all"), items.length)}
				{tabs.map((tab) => tabButton(tab.slug, tab.label, tab.count))}
			</ul>

			<GridCollection items={cards} itemsPerRow={3} />

			<div className={styles.directory__more}>
				<Button
					href={active === ALL ? directoryPath : `${directoryPath}/${active}`}
					variant="link"
					iconAfter="ArrowRight"
					label={t("viewAllDirectory")}
				/>
			</div>

			<aside className={styles.directory__banner}>
				<span className={styles.directory__bannerIcon} aria-hidden="true">
					<Icon name="Store" size={22} strokeWidth="1.6" />
				</span>
				<div className={styles.directory__bannerText}>
					<Heading as="h3" size="h4" className={styles.directory__bannerTitle}>
						{t("bannerTitle")}
					</Heading>
					<p>{t("bannerText")}</p>
				</div>
				<Button
					href={contactsPath}
					variant="danger"
					icon="Plus"
					label={t("bannerButton")}
				/>
			</aside>
		</Section>
	)
}
