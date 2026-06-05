"use client"

// Public, client-side filterable directory ("notebook" style).
//
// Two-tier browse + live search + an A→Z index over a grid of DirectoryCards:
//   • Tier 1 — group chips (Community, Faith, Services, Professional, …)
//   • Tier 2 — the selected group's categories, as chips OR (past
//     CATEGORY_CHIP_LIMIT) an auto dropdown, so long lists stay tidy.
//   • Results are sorted A→Z and split into letter sections (A, B, C…).
// Search is independent ("filter the visible results") and matches each item's
// `searchText`, so the long tail is always reachable by typing.
//
// Data + categories are meant to come from Contentful via DirectoryConnector;
// this component is pure presentation. With no `groups` it degrades to a single
// flat row of category chips.

import clsx from "clsx"
import { useEffect, useMemo, useState } from "react"
import { GridCollection } from "@/components/Collection"
import { Select } from "@/components/Forms/Select"
import { Heading, type HeadingProps } from "@/components/Headings"
import { DirectoryCard } from "./DirectoryCard"
import { Section } from "@/components/Section"
import { DirectorySearch } from "./DirectorySearch"
import styles from "./FilterableDirectory.module.scss"

export type DirectoryGroup = {
	slug: string
	label: string
	order?: number
}

export type DirectoryCategory = {
	/** Stable slug, matched against each item's `categorySlug`. */
	slug: string
	/** Localized, human-readable chip label. */
	label: string
	/** Sort order for the chips (lower first). */
	order?: number
	/** Which group this category belongs to (matches a DirectoryGroup slug). */
	groupSlug?: string
}

export type DirectoryItem = {
	id: string
	/** Which category this item belongs to (matches a DirectoryCategory slug). */
	categorySlug: string
	/** Display name (also the default search + A→Z sort key). */
	title: string
	/**
	 * Lowercased haystack the search box matches against (name + address + …).
	 * Optional — falls back to `title`.
	 */
	searchText?: string
	/** Card body — a Contentful rich-text document. */
	content?: unknown
	note?: React.ReactNode
	link?: { url?: string; name?: string; target?: string }
}

export type FilterableDirectoryLabels = {
	all?: string
	searchPlaceholder?: string
	searchAriaLabel?: string
	groupAriaLabel?: string
	categoryAriaLabel?: string
	clear?: string
	noResults?: string
	suggestionsCategories?: string
	suggestionsListings?: string
	/** Template with a `{count}` placeholder, e.g. "{count} listings found" (string, not a fn — server-safe). */
	resultsCount?: string
}

export type FilterableDirectoryProps = {
	items: DirectoryItem[]
	/** Provides chip labels + ordering; chips render only for categories present in `items`. */
	categories?: DirectoryCategory[]
	/** Optional first tier. When present (and categories carry `groupSlug`), browse becomes 2-tier. */
	groups?: DirectoryGroup[]
	/** Page heading — a resolved `heading` entry (rendered via the shared Heading component). */
	heading?: HeadingProps
	intro?: React.ReactNode
	itemsPerRow?: 1 | 2 | 3 | 4
	/** Show the search autocomplete dropdown (categories + listings). Default true. */
	autocomplete?: boolean
	labels?: FilterableDirectoryLabels
}

const ALL = "all"

// Above this many categories in the active group, tier 2 renders as a dropdown
// instead of a chip row (keeps long lists like "Professional" manageable).
const CATEGORY_CHIP_LIMIT = 6

const DEFAULT_LABELS: Required<FilterableDirectoryLabels> = {
	all: "All",
	searchPlaceholder: "Search for associations, keywords, or location…",
	searchAriaLabel: "Search listings",
	groupAriaLabel: "Filter by group",
	categoryAriaLabel: "Filter by category",
	clear: "Clear search",
	noResults: "No listings match your search.",
	suggestionsCategories: "Categories",
	suggestionsListings: "Listings",
	resultsCount: "{count} listings found",
}

// Max suggestions shown per section in the autocomplete dropdown.
const MAX_CATEGORY_SUGGESTIONS = 5
const MAX_LISTING_SUGGESTIONS = 7

// Sort/index name: drop a leading "[Sample] "-style bracket prefix so preview
// placeholders index by their real name.
function sortName(item: DirectoryItem): string {
	return item.title.replace(/^\s*\[[^\]]*\]\s*/, "").trim()
}

function letterOf(name: string): string {
	const m = name.match(/\p{L}/u)
	return m ? m[0].toUpperCase() : "#"
}

// Accent- and case-insensitive folding so French queries match regardless of
// diacritics ("quebec" → "Québec"). NFD splits accented letters into base +
// combining mark, then the marks are stripped. Cyrillic is left intact, so
// Bulgarian search keeps working within its own script.
function fold(s: string): string {
	return s
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
}

// Filter chip. Raw <button> on purpose — the shared <Button> takes only a string
// `label` and has no pressed/active state or count slot, so it can't express a
// toggle chip. Mirrors the canonical Search bar's intentionally-raw chips.
// Module-level so it isn't a fresh component type each render (no remount/jank).
const Chip = ({
	label,
	count,
	active,
	onClick,
}: {
	label: string
	count: number
	active: boolean
	onClick: () => void
}) => (
	<button
		type="button"
		className={styles.directory__chip}
		data-active={active}
		aria-pressed={active}
		onClick={onClick}
	>
		{label}
		<span className={styles.directory__chipCount}>{count}</span>
	</button>
)

export const FilterableDirectory = ({
	items,
	categories = [],
	groups = [],
	heading,
	intro,
	itemsPerRow = 2,
	autocomplete = true,
	labels,
}: FilterableDirectoryProps) => {
	const t = { ...DEFAULT_LABELS, ...labels }

	const [activeGroup, setActiveGroup] = useState<string>(ALL)
	const [activeCategory, setActiveCategory] = useState<string>(ALL)
	const [query, setQuery] = useState("")
	const [highlightedId, setHighlightedId] = useState<string | null>(null)

	const labelBySlug = useMemo(
		() => new Map(categories.map((c) => [c.slug, c.label])),
		[categories],
	)
	const groupBySlug = useMemo(
		() => new Map(categories.map((c) => [c.slug, c.groupSlug])),
		[categories],
	)
	const hasGroups = groups.length > 0 && categories.some((c) => c.groupSlug)

	// Per-category item counts (drives every chip badge / dropdown count).
	const countByCategory = useMemo(() => {
		const m = new Map<string, number>()
		for (const item of items)
			m.set(item.categorySlug, (m.get(item.categorySlug) ?? 0) + 1)
		return m
	}, [items])

	// Tier 1 — group chips that actually have items, ordered by the CMS `order`.
	const groupChips = useMemo(() => {
		if (!hasGroups) return []
		const counts = new Map<string, number>()
		for (const item of items) {
			const g = groupBySlug.get(item.categorySlug)
			if (g) counts.set(g, (counts.get(g) ?? 0) + 1)
		}
		return groups
			.filter((g) => counts.get(g.slug))
			.map((g) => ({
				slug: g.slug,
				label: g.label,
				order: g.order ?? Number.MAX_SAFE_INTEGER,
				count: counts.get(g.slug) ?? 0,
			}))
			.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
	}, [hasGroups, items, groups, groupBySlug])

	// Tier 2 — categories shown for the current selection.
	const categoryChips = useMemo(() => {
		const inScope = (c: DirectoryCategory) => {
			if (!countByCategory.get(c.slug)) return false
			if (!hasGroups) return true
			return activeGroup !== ALL && c.groupSlug === activeGroup
		}
		return categories
			.filter(inScope)
			.map((c) => ({
				slug: c.slug,
				label: c.label,
				order: c.order ?? Number.MAX_SAFE_INTEGER,
				count: countByCategory.get(c.slug) ?? 0,
			}))
			.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
	}, [categories, countByCategory, hasGroups, activeGroup])

	const showCategoryTier = hasGroups ? activeGroup !== ALL : true
	const useCategoryDropdown = categoryChips.length > CATEGORY_CHIP_LIMIT

	const filtered = useMemo(() => {
		const q = fold(query.trim())
		return items.filter((item) => {
			if (hasGroups && activeGroup !== ALL) {
				if (groupBySlug.get(item.categorySlug) !== activeGroup) return false
				if (activeCategory !== ALL && item.categorySlug !== activeCategory)
					return false
			} else if (!hasGroups && activeCategory !== ALL) {
				if (item.categorySlug !== activeCategory) return false
			}
			if (!q) return true
			return fold(item.searchText ?? item.title).includes(q)
		})
	}, [items, hasGroups, activeGroup, activeCategory, query, groupBySlug])

	// Sort A→Z and split into letter sections (A, B, C…).
	const sections = useMemo(() => {
		const sorted = [...filtered].sort((a, b) =>
			sortName(a).localeCompare(sortName(b), undefined, {
				sensitivity: "base",
			}),
		)
		const out: { letter: string; items: DirectoryItem[] }[] = []
		for (const item of sorted) {
			const letter = letterOf(sortName(item))
			const last = out[out.length - 1]
			if (last && last.letter === letter) last.items.push(item)
			else out.push({ letter, items: [item] })
		}
		return out
	}, [filtered])

	// Autocomplete suggestions (computed across the whole dataset so you can jump
	// anywhere, regardless of the active group/category).
	const suggestions = useMemo(() => {
		const q = fold(query.trim())
		if (!autocomplete || !q) return { categories: [], listings: [] }
		const cats = categories
			.filter((c) => countByCategory.get(c.slug) && fold(c.label).includes(q))
			.slice(0, MAX_CATEGORY_SUGGESTIONS)
			.map((c) => ({ slug: c.slug, label: c.label }))
		const lists = items
			.filter((it) => fold(it.searchText ?? it.title).includes(q))
			.slice(0, MAX_LISTING_SUGGESTIONS)
			.map((it) => ({ id: it.id, label: it.title }))
		return { categories: cats, listings: lists }
	}, [autocomplete, query, categories, items, countByCategory])

	const pickCategory = (slug: string) => {
		setQuery("")
		setActiveGroup(hasGroups ? (groupBySlug.get(slug) ?? ALL) : ALL)
		setActiveCategory(slug)
	}

	// Selecting a listing clears filters so the card is guaranteed in the DOM,
	// then scrolls to + briefly highlights it.
	const pickListing = (id: string) => {
		setQuery("")
		setActiveGroup(ALL)
		setActiveCategory(ALL)
		setHighlightedId(id)
	}

	useEffect(() => {
		if (!highlightedId) return
		document
			.getElementById(`dir-item-${highlightedId}`)
			?.scrollIntoView({ behavior: "smooth", block: "start" })
		const tmo = setTimeout(() => setHighlightedId(null), 2200)
		return () => clearTimeout(tmo)
	}, [highlightedId])

	const renderCard = (item: DirectoryItem) => ({
		id: item.id,
		content: (
			<div
				id={`dir-item-${item.id}`}
				className={clsx(
					styles.directory__card,
					highlightedId === item.id && styles["directory__card--highlight"],
				)}
			>
				<DirectoryCard
					tag={labelBySlug.get(item.categorySlug) ?? item.categorySlug}
					title={item.title}
					content={item.content}
					note={item.note}
					link={item.link}
				/>
			</div>
		),
	})

	const selectGroup = (slug: string) => {
		setActiveGroup(slug)
		setActiveCategory(ALL)
	}

	return (
		<Section className={styles.directory}>
			{(heading?.heading || intro) && (
				<header className={styles.directory__header}>
					{heading?.heading && (
						<Heading as={heading.as ?? "h2"} size={heading.size ?? "h2"}>
							{heading.heading}
						</Heading>
					)}
					{intro && <div className={styles.directory__intro}>{intro}</div>}
				</header>
			)}

			<div className={styles.directory__controls}>
				<DirectorySearch
					query={query}
					onQueryChange={setQuery}
					enabled={autocomplete}
					categoryMatches={suggestions.categories}
					listingMatches={suggestions.listings}
					onPickCategory={pickCategory}
					onPickListing={pickListing}
					labels={{
						placeholder: t.searchPlaceholder,
						searchAriaLabel: t.searchAriaLabel,
						clear: t.clear,
						categoriesHeading: t.suggestionsCategories,
						listingsHeading: t.suggestionsListings,
					}}
				/>

				{/* Tier 1 — group chips (or flat category chips when no groups). */}
				{hasGroups && groupChips.length > 0 && (
					<div
						className={styles.directory__chips}
						role="group"
						aria-label={t.groupAriaLabel}
					>
						<Chip
							label={t.all}
							count={items.length}
							active={activeGroup === ALL}
							onClick={() => selectGroup(ALL)}
						/>
						{groupChips.map((g) => (
							<Chip
								key={g.slug}
								label={g.label}
								count={g.count}
								active={activeGroup === g.slug}
								onClick={() => selectGroup(g.slug)}
							/>
						))}
					</div>
				)}

				{/* Tier 2 — categories: chip row, or a dropdown once the list grows. */}
				{showCategoryTier &&
					categoryChips.length > 0 &&
					(useCategoryDropdown ? (
						<Select
							className={styles.directory__categorySelect}
							value={activeCategory}
							inputSize="sm"
							aria-label={t.categoryAriaLabel}
							onChange={(e) => setActiveCategory(e.target.value)}
						>
							<option value={ALL}>{t.all}</option>
							{categoryChips.map((c) => (
								<option key={c.slug} value={c.slug}>
									{c.label} ({c.count})
								</option>
							))}
						</Select>
					) : (
						<div
							className={`${styles.directory__chips} ${styles.directory__chipsSub}`}
							role="group"
							aria-label={t.categoryAriaLabel}
						>
							<Chip
								label={t.all}
								count={categoryChips.reduce((n, c) => n + c.count, 0)}
								active={activeCategory === ALL}
								onClick={() => setActiveCategory(ALL)}
							/>
							{categoryChips.map((c) => (
								<Chip
									key={c.slug}
									label={c.label}
									count={c.count}
									active={activeCategory === c.slug}
									onClick={() => setActiveCategory(c.slug)}
								/>
							))}
						</div>
					))}
			</div>

			<p className={styles.directory__count} aria-live="polite">
				{(t.resultsCount || DEFAULT_LABELS.resultsCount).replace(
					"{count}",
					String(filtered.length),
				)}
			</p>

			{sections.length > 0 ? (
				<div className={styles.directory__index}>
					{sections.map((section) => (
						<div key={section.letter} className={styles.directory__section}>
							<Heading as="h3" size="h3" className={styles.directory__letter}>
								{section.letter}
							</Heading>
							<GridCollection
								items={section.items.map(renderCard)}
								itemsPerRow={itemsPerRow}
							/>
						</div>
					))}
				</div>
			) : (
				<p className={styles.directory__empty}>{t.noResults}</p>
			)}
		</Section>
	)
}

export default FilterableDirectory
