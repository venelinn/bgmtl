"use client"

// Public, client-side filterable directory ("notebook" style).
//
// Deliberately simple: live search + a single category dropdown ("All" on top,
// then every category that has listings) over an A→Z index of DirectoryCards.
// Search is independent ("filter the visible results") and matches each item's
// `searchText`, so the long tail is always reachable by typing.
//
// Data + categories come from Contentful via DirectoryConnector; this component
// is pure presentation.

import clsx from "clsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { GridCollection } from "@/components/Collection"
import { Select } from "@/components/Forms/Select"
import { Heading, type HeadingProps } from "@/components/Headings"
import { DirectoryCard } from "./DirectoryCard"
import { Section } from "@/components/Section"
import { DirectorySearch } from "./DirectorySearch"
import styles from "./FilterableDirectory.module.scss"

export type DirectoryCategory = {
	/** Stable slug, matched against each item's `categorySlugs`. */
	slug: string
	/** Localized, human-readable label. */
	label: string
	/** Sort order in the dropdown (lower first). */
	order?: number
}

export type DirectoryItem = {
	id: string
	/** Category slugs this item is tagged with (each matches a DirectoryCategory slug). */
	categorySlugs: string[]
	/** Display name (also the default search + A→Z sort key). */
	title: string
	/**
	 * Lowercased haystack the search box matches against (name + address + …).
	 * Optional — falls back to `title`.
	 */
	searchText?: string
	phone?: string
	email?: string
	website?: string
	address?: string
	note?: React.ReactNode
	/** Logo image URL (resolved from the entry's `logo` asset). */
	logo?: string
}

export type FilterableDirectoryLabels = {
	all?: string
	searchPlaceholder?: string
	searchAriaLabel?: string
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
	/** Provides dropdown labels + ordering; options render only for categories present in `items`. */
	categories?: DirectoryCategory[]
	/** Page heading — a resolved `heading` entry (rendered via the shared Heading component). */
	heading?: HeadingProps
	intro?: React.ReactNode
	itemsPerRow?: 1 | 2 | 3 | 4
	/** Show the search autocomplete dropdown (categories + listings). Default true. */
	autocomplete?: boolean
	/** Category slug pre-selected from the URL path (`/community/<slug>`). Seeds the initial (SSR) filter. */
	initialCategory?: string
	/**
	 * Locale-prefixed base path for the directory, e.g. `/en/community`. When set,
	 * category → path segment and search → `?q=` are mirrored into the URL so the
	 * current view is shareable/bookmarkable.
	 */
	basePath?: string
	labels?: FilterableDirectoryLabels
}

const ALL = "all"

const DEFAULT_LABELS: Required<FilterableDirectoryLabels> = {
	all: "All",
	searchPlaceholder: "Search for associations, keywords, or location…",
	searchAriaLabel: "Search listings",
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

// Section letter for the A→Z index. Diacritics are stripped (NFD + drop combining
// marks) so accented names group with their base letter ("Étoile" → "E"); without
// this they'd sort interleaved with un-accented names (base sensitivity) yet land
// in separate "É"/"E" sections, producing duplicate React keys. Cyrillic is left
// intact, matching `fold`.
function letterOf(name: string): string {
	const m = name.match(/\p{L}/u)
	if (!m) return "#"
	return m[0]
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toUpperCase()
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

// Derive the active category slug from a directory pathname, relative to
// `basePath` (`/en/community` → ALL, `/en/community/school` → "school").
function categoryFromPath(pathname: string, basePath: string): string {
	if (pathname === basePath || pathname === `${basePath}/`) return ALL
	if (pathname.startsWith(`${basePath}/`)) {
		return decodeURIComponent(pathname.slice(basePath.length + 1).split("/")[0]) || ALL
	}
	return ALL
}

export const FilterableDirectory = ({
	items,
	categories = [],
	heading,
	intro,
	itemsPerRow = 2,
	autocomplete = true,
	initialCategory,
	basePath,
	labels,
}: FilterableDirectoryProps) => {
	const t = { ...DEFAULT_LABELS, ...labels }

	// Seed from the URL-provided category so the server render is already filtered
	// (SSR/shareable). `query` starts empty to match SSR HTML, then hydrates from
	// `?q=` in an effect below (search is a client-only, non-indexed filter).
	const [activeCategory, setActiveCategory] = useState<string>(initialCategory ?? ALL)
	const [query, setQuery] = useState("")
	const [highlightedId, setHighlightedId] = useState<string | null>(null)

	// Skip the URL-sync effect's first run so hydration doesn't rewrite the URL.
	const didMountRef = useRef(false)

	// Post-hydration: adopt `?q=` from the shared URL, and keep state in sync when
	// the user navigates back/forward (popstate) between category paths.
	useEffect(() => {
		if (!basePath) return
		const applyFromLocation = () => {
			const params = new URLSearchParams(window.location.search)
			setQuery(params.get("q") ?? "")
			setActiveCategory(categoryFromPath(window.location.pathname, basePath))
		}
		applyFromLocation()
		window.addEventListener("popstate", applyFromLocation)
		return () => window.removeEventListener("popstate", applyFromLocation)
	}, [basePath])

	// Mirror the current category + search into the URL (replaceState — no server
	// round-trip, no history spam) so it's copy-paste shareable and reload-safe.
	useEffect(() => {
		if (!basePath) return
		if (!didMountRef.current) {
			didMountRef.current = true
			return
		}
		const params = new URLSearchParams(window.location.search)
		const q = query.trim()
		if (q) params.set("q", q)
		else params.delete("q")
		const catPath = activeCategory === ALL ? basePath : `${basePath}/${activeCategory}`
		const qs = params.toString()
		const nextUrl = qs ? `${catPath}?${qs}` : catPath
		if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
			window.history.replaceState(window.history.state, "", nextUrl)
		}
	}, [activeCategory, query, basePath])

	const labelBySlug = useMemo(
		() => new Map(categories.map((c) => [c.slug, c.label])),
		[categories],
	)

	// Per-category item counts (drives the dropdown option counts).
	const countByCategory = useMemo(() => {
		const m = new Map<string, number>()
		for (const item of items)
			for (const slug of item.categorySlugs)
				m.set(slug, (m.get(slug) ?? 0) + 1)
		return m
	}, [items])

	// Every category that actually has listings, ordered by the CMS `order`.
	const categoryOptions = useMemo(() => {
		return categories
			.filter((c) => countByCategory.get(c.slug))
			.map((c) => ({
				slug: c.slug,
				label: c.label,
				order: c.order ?? Number.MAX_SAFE_INTEGER,
				count: countByCategory.get(c.slug) ?? 0,
			}))
			.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
	}, [categories, countByCategory])

	const filtered = useMemo(() => {
		const q = fold(query.trim())
		return items.filter((item) => {
			if (activeCategory !== ALL && !item.categorySlugs.includes(activeCategory))
				return false
			if (!q) return true
			return fold(item.searchText ?? item.title).includes(q)
		})
	}, [items, activeCategory, query])

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
	// anywhere, regardless of the active category).
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
		setActiveCategory(slug)
	}

	// Selecting a listing clears filters so the card is guaranteed in the DOM,
	// then scrolls to + briefly highlights it.
	const pickListing = (id: string) => {
		setQuery("")
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
					tags={item.categorySlugs.map((s) => ({
						label: labelBySlug.get(s) ?? s,
						// Highlight the tag matching the current category filter.
						active: activeCategory === s,
						// Real link to the category page (crawlable, cmd/middle-click opens
						// it) — but normal click filters in-page instantly, no refetch.
						href: basePath ? `${basePath}/${s}` : undefined,
						onClick: basePath
							? (e: React.MouseEvent) => {
									// Let modified clicks (new tab / new window) navigate for real.
									if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
									e.preventDefault()
									// Clicking the already-active tag clears the filter (toggle).
									pickCategory(activeCategory === s ? ALL : s)
								}
							: undefined,
					}))}
					title={item.title}
					logo={item.logo}
					phone={item.phone}
					email={item.email}
					website={item.website}
					address={item.address}
					note={item.note}
				/>
			</div>
		),
	})

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

				{/* Single category dropdown — "All" on top, then every category with listings.
				    Wrapped so the layout class lands on the flex child (Select spreads
				    className onto the inner <select>, not its wrapper). */}
				{categoryOptions.length > 0 && (
					<div className={styles.directory__categoryFilter}>
						<Select
							full
							value={activeCategory}
							icon="ListFilter"
							aria-label={t.categoryAriaLabel}
							onChange={(e) => setActiveCategory(e.target.value)}
						>
							<option value={ALL}>{t.all}</option>
							{categoryOptions.map((c) => (
								<option key={c.slug} value={c.slug}>
									{c.label} ({c.count})
								</option>
							))}
						</Select>
					</div>
				)}
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
