"use client"

import { useTranslations } from "next-intl"
import { type ReactNode, useMemo, useState } from "react"
import { GridCollection } from "@/components/Collection"
import { Heading } from "@/components/Headings"
import { Icon } from "@/components/Icon"
import { Pagination } from "@/components/Pagination/Pagination"
import { Section } from "@/components/Section"
import { EVENT_TAGS, type EventItem, type EventTag } from "@/types/events"
import { collapseEventSeries } from "@/utils/eventSeries"
import { Event } from "./Event"
import { EventArchiveCard } from "./EventArchiveCard"
import styles from "./EventsBrowser.module.scss"

type EventsBrowserProps = {
	events: EventItem[]
	locale: string
	fallbackImage?: string
	/** Past events per archive page. */
	eventsPerPage?: number
	/** Rendered next to the upcoming list (calendar, CTA, donate…). */
	sidebar?: ReactNode
}

const ALL = "all"

// Case- and accent-insensitive match ("Montréal" ~ "montreal").
const fold = (s: string) =>
	s
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()

const titleOf = (event: EventItem) =>
	typeof event.heading === "string" ? event.heading : (event.heading?.heading ?? "")

/**
 * The /events page body: upcoming/past jump tabs with counts, a search box and
 * tag chips that filter both lists, the upcoming list beside the sidebar, and a
 * full-width archive band (year tabs, compact cards, pagination).
 */
export function EventsBrowser({
	events,
	locale,
	fallbackImage,
	eventsPerPage = 9,
	sidebar,
}: EventsBrowserProps) {
	const t = useTranslations("Events")
	const tPage = useTranslations("Pagination")
	const [query, setQuery] = useState("")
	const [tag, setTag] = useState<EventTag | typeof ALL>(ALL)
	const [year, setYear] = useState<string>(ALL)
	const [page, setPage] = useState(1)

	const { upcoming, past, years, usedTags } = useMemo(() => {
		const now = new Date()
		const up: EventItem[] = []
		const old: EventItem[] = []
		const yearSet = new Set<number>()
		const tagSet = new Set<string>()
		// A series (one event, several dates) lists once: next date upcoming, latest date in the archive.
		for (const event of collapseEventSeries(events, now.getTime())) {
			for (const tg of event.tags ?? []) tagSet.add(tg)
			if (new Date(event.date) > now) up.push(event)
			else {
				old.push(event)
				yearSet.add(new Date(event.date).getFullYear())
			}
		}
		up.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		old.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		return {
			upcoming: up,
			past: old,
			years: [...yearSet].sort((a, b) => b - a),
			// Chips only for tags that are actually in use, in the model's order.
			usedTags: EVENT_TAGS.filter((tg) => tagSet.has(tg)),
		}
	}, [events])

	const matches = (event: EventItem) => {
		if (tag !== ALL && !(event.tags ?? []).includes(tag)) return false
		const q = fold(query.trim())
		if (!q) return true
		return fold(`${titleOf(event)} ${event.venue ?? ""}`).includes(q)
	}

	const upcomingShown = upcoming.filter(matches)
	const pastFiltered = past.filter(
		(e) => matches(e) && (year === ALL || new Date(e.date).getFullYear() === Number(year)),
	)
	// The archive is a 3-column grid: round the page size down to whole rows.
	const perPage = Math.max(3, Math.floor(eventsPerPage / 3) * 3)
	const pastPage = pastFiltered.slice((page - 1) * perPage, page * perPage)

	// Any filter change starts the archive again from page 1.
	const resetPage = () => setPage(1)

	return (
		<>
			{/* Toolbar: jump tabs + search, then tag chips */}
			<div className={styles.toolbar}>
				<div className={styles.toolbar__row}>
					{/* Jump links to the two lists (not a filter, so no selected state). */}
					<nav className={styles.toolbar__jumps} aria-label={t("upcomingEvents")}>
						<a href="#upcoming" className={styles.toolbar__jump}>
							{t("tabUpcoming")} <span>({upcomingShown.length})</span>
							<Icon name="ArrowDown" size={16} strokeWidth="1.8" />
						</a>
						<a href="#past" className={styles.toolbar__jump}>
							{t("tabPast")} <span>({pastFiltered.length})</span>
							<Icon name="ArrowDown" size={16} strokeWidth="1.8" />
						</a>
					</nav>
					<label className={styles.toolbar__search}>
						<Icon name="Search" size={18} strokeWidth="1.6" />
						<input
							type="search"
							value={query}
							onChange={(e) => {
								setQuery(e.target.value)
								resetPage()
							}}
							placeholder={t("searchPlaceholder")}
							aria-label={t("searchAriaLabel")}
						/>
					</label>
				</div>

				{usedTags.length > 0 && (
					<ul className={styles.toolbar__chips} aria-label={t("filterAriaLabel")}>
						{[ALL, ...usedTags].map((tg) => (
							<li key={tg}>
								<button
									type="button"
									className={styles.toolbar__chip}
									aria-pressed={tag === tg}
									onClick={() => {
										setTag(tg as EventTag | typeof ALL)
										resetPage()
									}}
								>
									{tg === ALL ? t("all") : t(`tags.${tg}`)}
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Upcoming list beside the sidebar */}
			<div className="page__with-sidebar" data-has-sidebar>
				<div className="page__main">
					<div id="upcoming" className={styles.anchor}>
						<Heading as="h2" size="h2" className={styles.heading}>
							{t("upcomingEvents")}
						</Heading>
					</div>
					{upcomingShown.length > 0 ? (
						upcomingShown.map((event) => (
							<Event
								key={event.id}
								event={event}
								type="upcoming"
								locale={locale}
								fallbackImage={fallbackImage}
							/>
						))
					) : (
						<p className={styles.empty}>{t("noResults")}</p>
					)}
				</div>
				{sidebar}
			</div>

			{/* Past events archive band */}
			<Section size="full" padding="large" classNames={{ main: styles.archive }}>
				<div className={styles.archive__header} id="past">
					<div>
						<span className={styles.archive__eyebrow}>
							<Icon name="History" size={16} strokeWidth="1.8" />
							{t("archiveEyebrow")}
						</span>
						<Heading as="h2" size="h2" className={styles.archive__title}>
							{t("archiveTitle")}
						</Heading>
					</div>
					{years.length > 1 && (
						<div className={styles.archive__years}>
							{[ALL, ...years.map(String)].map((y) => (
								<button
									key={y}
									type="button"
									className={styles.archive__year}
									aria-pressed={year === y}
									onClick={() => {
										setYear(y)
										resetPage()
									}}
								>
									{y === ALL ? t("allYears") : y}
								</button>
							))}
						</div>
					)}
				</div>

				{pastPage.length > 0 ? (
					<GridCollection
						items={pastPage.map((event) => ({
							id: event.id,
							content: <EventArchiveCard event={event} locale={locale} />,
						}))}
						itemsPerRow={3}
					/>
				) : (
					<p className={styles.empty}>{t("noResults")}</p>
				)}

				{pastFiltered.length > 0 && (
					<div className={styles.archive__footer}>
						<span className={styles.archive__count}>
							{t("showingCount", { shown: pastPage.length, total: pastFiltered.length })}
						</span>
						{pastFiltered.length > perPage && (
							<Pagination
								totalItems={pastFiltered.length}
								currentPageIndex={page}
								handleSlideTo={(p: number) => {
									setPage(p)
									document.getElementById("past")?.scrollIntoView({ block: "start" })
								}}
								pageSize={perPage}
								variant="extended"
								labels={{
									first: tPage("first"),
									back: tPage("back"),
									next: tPage("next"),
									last: tPage("last"),
									of: tPage("of"),
								}}
							/>
						)}
					</div>
				)}
			</Section>
		</>
	)
}
