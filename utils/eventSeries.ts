import { slugify } from "@/utils/common"

/**
 * Event series: one event on several dates (e.g. the monthly Bulgarian bazaar).
 *
 * In Contentful a series is either one event with `additionalDates`
 * (expanded into one occurrence per date by `expandEventDates`) or several
 * event entries with the same Bulgarian heading. Either way every occurrence
 * shares a series key, so lists can show one card per series.
 */

type SeriesEvent = {
	id: string
	date?: string
	doorsOpen?: string
	heading?: unknown
	bgHeading?: string
	additionalDates?: unknown
	[key: string]: unknown
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** Keep `value`'s time of day (and zone, if any) but move it to `day`. */
const onDay = (value: string | undefined, day: string) =>
	value ? `${day}${value.slice(10)}` : value

/**
 * One occurrence per extra date in `additionalDates` (YYYY-MM-DD), with the
 * main date's time of day and doors-open time. Occurrence ids are
 * `<entry id>--<YYYY-MM-DD>`; `seriesId` points at the entry.
 */
export function expandEventDates<T extends SeriesEvent>(events: T[]): T[] {
	const out: T[] = []
	for (const event of events) {
		if (!event) continue
		out.push(event)
		const extra = Array.isArray(event.additionalDates) ? event.additionalDates : []
		const mainDay = String(event.date ?? "").slice(0, 10)
		const days = [...new Set(extra.map(String).filter((d) => DAY.test(d) && d !== mainDay))]
		for (const day of days) {
			out.push({
				...event,
				id: `${event.id}--${day}`,
				seriesId: event.id,
				date: onDay(event.date, day) ?? day,
				doorsOpen: onDay(event.doorsOpen, day),
			})
		}
	}
	return out
}

/** The entry id behind an occurrence id (`<entry id>--<YYYY-MM-DD>`). */
export const eventEntryId = (id: string) => id.replace(/--\d{4}-\d{2}-\d{2}$/, "")

const headingText = (heading: unknown) =>
	typeof heading === "string"
		? heading
		: heading && typeof heading === "object" && "heading" in heading
			? String((heading as { heading?: unknown }).heading ?? "")
			: ""

/** Same key for every date of a series (Bulgarian heading without the date suffix). */
export function eventSeriesKey(event: SeriesEvent): string {
	const text = event.bgHeading || headingText(event.heading) || event.id
	return slugify(String(text).replace(/ \d{4}-\d{2}-\d{2}$/, ""))
}

/**
 * One card per series. Upcoming lists show the next date, past lists the most
 * recent one. `moreDates` counts the series' other upcoming dates (for the
 * "+N дати" chip). Order of the input list is kept.
 */
export function collapseEventSeries<T extends SeriesEvent>(
	events: T[],
	now: number = Date.now(),
): (T & { moreDates?: number })[] {
	const time = (e: SeriesEvent) => new Date(e.date ?? 0).getTime()
	const upcoming = new Map<string, T[]>()
	for (const e of events) {
		if (time(e) <= now) continue
		const key = eventSeriesKey(e)
		upcoming.set(key, [...(upcoming.get(key) ?? []), e])
	}

	const pick = new Map<string, T>()
	for (const e of events) {
		const key = `${eventSeriesKey(e)}|${time(e) > now ? "up" : "past"}`
		const current = pick.get(key)
		const better = time(e) > now ? !current || time(e) < time(current) : !current || time(e) > time(current)
		if (better) pick.set(key, e)
	}
	const keep = new Set(pick.values())

	return events
		.filter((e) => keep.has(e))
		.map((e) => {
			const count = time(e) > now ? (upcoming.get(eventSeriesKey(e))?.length ?? 1) - 1 : 0
			return count > 0 ? { ...e, moreDates: count } : e
		})
}
