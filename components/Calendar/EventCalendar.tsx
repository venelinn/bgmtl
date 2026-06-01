"use client"

import { format, type Locale } from "date-fns"
import { bg, enCA } from "date-fns/locale"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Icon } from "@/components/Icon"
import { Heading, type HeadingProps } from "../Headings"
import styles from "./EventCalendar.module.scss"

export interface CalendarEvent {
	date: string
	title: string
	permalink: string
	isPastEvent: boolean
}

interface EventCalendarProps {
	calendarEvents: CalendarEvent[]
	locale: string
	selectedDate?: string
	onDateSelect?: (date: string) => void
	isLoading?: boolean
	heading?: HeadingProps
}

interface CalendarDay {
	date: string
	dayNumber: number
	isCurrentMonth: boolean
	isToday: boolean
	isPast: boolean
	hasEvent: boolean
	eventPermalink?: string
	isPastEvent?: boolean
}

const locales: Record<string, Locale> = {
	en: enCA,
	"en-CA": enCA,
	bg: bg,
	"bg-BG": bg,
}

function formatDateKey(date: Date): string {
	return date.toISOString().split("T")[0]
}

export function EventCalendar({
	calendarEvents,
	locale,
	selectedDate,
	onDateSelect,
	heading = {},
	isLoading = false,
}: EventCalendarProps) {
	const t = useTranslations()
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const selectedLocale = locales[locale] || enCA

	// Generate localized weekday names (short format)
	const WEEKDAYS = useMemo(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const date = new Date(2024, 0, i) // Start from Sunday
			return format(date, "EEE", { locale: selectedLocale })
		})
	}, [selectedLocale])

	// Generate localized month names
	const MONTHS = useMemo(() => {
		return Array.from({ length: 12 }, (_, i) => {
			const date = new Date(2024, i, 1)
			return format(date, "MMMM", { locale: selectedLocale })
		})
	}, [selectedLocale])

	// Create a map of dates to event data (permalink and isPastEvent status)
	const eventMap = useMemo(() => {
		const map = new Map<string, { permalink: string; isPastEvent: boolean }>()
		calendarEvents.forEach((event) => {
			map.set(event.date, {
				permalink: event.permalink,
				isPastEvent: event.isPastEvent,
			})
		})
		return map
	}, [calendarEvents])
	const todayKey = formatDateKey(today)

	const [currentMonth, setCurrentMonth] = useState(today.getMonth())
	const [currentYear, setCurrentYear] = useState(today.getFullYear())

	// Create set for quick lookup
	const eventSet = useMemo(
		() => new Set(calendarEvents.map((e) => e.date)),
		[calendarEvents],
	)

	// Generate calendar days for current month view
	const calendarDays = useMemo((): CalendarDay[] => {
		const days: CalendarDay[] = []
		const firstDay = new Date(currentYear, currentMonth, 1)
		const lastDay = new Date(currentYear, currentMonth + 1, 0)
		const startDayOfWeek = firstDay.getDay()

		// Add days from previous month
		const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
		for (let i = startDayOfWeek - 1; i >= 0; i--) {
			const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i)
			const dateKey = formatDateKey(date)
			const eventData = eventMap.get(dateKey)
			days.push({
				date: dateKey,
				dayNumber: date.getDate(),
				isCurrentMonth: false,
				isToday: dateKey === todayKey,
				isPast: date < today,
				hasEvent: eventSet.has(dateKey),
				eventPermalink: eventData?.permalink,
				isPastEvent: eventData?.isPastEvent,
			})
		}

		// Add days from current month
		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(currentYear, currentMonth, day)
			const dateKey = formatDateKey(date)
			const eventData = eventMap.get(dateKey)
			days.push({
				date: dateKey,
				dayNumber: day,
				isCurrentMonth: true,
				isToday: dateKey === todayKey,
				isPast: date < today,
				hasEvent: eventSet.has(dateKey),
				eventPermalink: eventData?.permalink,
				isPastEvent: eventData?.isPastEvent,
			})
		}

		// Add days from next month to complete the grid
		const remainingDays = 42 - days.length // 6 rows x 7 days
		for (let i = 1; i <= remainingDays; i++) {
			const date = new Date(currentYear, currentMonth + 1, i)
			const dateKey = formatDateKey(date)
			const eventData = eventMap.get(dateKey)
			days.push({
				date: dateKey,
				dayNumber: i,
				isCurrentMonth: false,
				isToday: dateKey === todayKey,
				isPast: date < today,
				hasEvent: eventSet.has(dateKey),
				eventPermalink: eventData?.permalink,
				isPastEvent: eventData?.isPastEvent,
			})
		}

		return days
	}, [currentMonth, currentYear, eventSet, eventMap, todayKey, today])

	function handlePrevMonth() {
		if (currentMonth === 0) {
			setCurrentMonth(11)
			setCurrentYear(currentYear - 1)
		} else {
			setCurrentMonth(currentMonth - 1)
		}
	}

	function handleNextMonth() {
		if (currentMonth === 11) {
			setCurrentMonth(0)
			setCurrentYear(currentYear + 1)
		} else {
			setCurrentMonth(currentMonth + 1)
		}
	}

	function handleDayClick(day: CalendarDay) {
		if (!day.hasEvent) return
		onDateSelect?.(day.date)
	}

	return (
		<div className={styles.calendar}>
			<Heading as="h2" size="base" highlight className={styles.heading}>
				{heading.heading || t("Events.eventsCalendar")}
			</Heading>

			{/* Header with navigation */}
			<div className={styles.header}>
				<button
					type="button"
					onClick={handlePrevMonth}
					className={styles.navButton}
					aria-label="Previous month"
				>
					<Icon name="ChevronLeft" size="1.25em" />
				</button>
				<span className={styles.monthYear}>
					{MONTHS[currentMonth]} {currentYear}
				</span>
				<button
					type="button"
					onClick={handleNextMonth}
					className={styles.navButton}
					aria-label="Next month"
				>
					<Icon name="ChevronRight" size="1.25em" />
				</button>
			</div>

			{/* Weekday headers */}
			<div className={styles.weekdays}>
				{WEEKDAYS.map((day) => (
					<div key={day} className={styles.weekday}>
						{day}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div className={styles.grid}>
				{isLoading
					? // Loading skeleton
						Array.from({ length: 35 }).map((_, i) => (
							<div key={i} className={styles.daySkeleton} />
						))
					: calendarDays.map((day) => {
							const dayContent = (
								<span className={styles.dayNumber}>{day.dayNumber}</span>
							)
							const dayClasses = `
                ${styles.day}
                ${!day.isCurrentMonth ? styles.otherMonth : ""}
                ${day.isToday ? styles.today : ""}
                ${day.isPast ? styles.past : ""}
                ${day.hasEvent ? styles.hasEvent : ""}
                ${day.isPastEvent ? styles.pastEvent : styles.upcomingEvent}
                ${selectedDate === day.date ? styles.selected : ""}
              `

							// If day has an event, render as Link
							if (day.hasEvent && day.eventPermalink) {
								return (
									<Link
										key={day.date}
										href={day.eventPermalink}
										className={dayClasses}
										aria-label={`${day.dayNumber} ${MONTHS[currentMonth]} - has event`}
									>
										{dayContent}
									</Link>
								)
							}

							// Otherwise render as disabled button
							return (
								<button
									key={day.date}
									type="button"
									className={dayClasses}
									onClick={() => handleDayClick(day)}
									disabled
									aria-label={`${day.dayNumber} ${MONTHS[currentMonth]}`}
								>
									{dayContent}
								</button>
							)
						})}
			</div>
		</div>
	)
}
