import { format } from "date-fns"
import { bg, enCA, frCA } from "date-fns/locale"

// Shared locale configuration
const locales = {
	en: enCA,
	"en-CA": enCA,
	bg: bg,
	"bg-BG": bg,
	fr: frCA,
	"fr-CA": frCA,
}

/**
 * Contentful stores event dates as a naive local datetime ("2025-12-13T18:30")
 * with no offset, so `new Date(str)` would resolve it against the *server's*
 * timezone (UTC in production) and shift the displayed time. Build the Date
 * from the literal parts instead, exactly like the newsletter renderer does.
 *
 * @param {string} dateStr
 * @returns {Date|null}
 */
const parseNaive = (dateStr) => {
	const m = String(dateStr || "").match(
		/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/,
	)
	if (!m) {
		const fallback = new Date(dateStr)
		return Number.isNaN(fallback.getTime()) ? null : fallback
	}
	const [, y, mo, d, h = "0", mi = "0"] = m
	return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))
}

/**
 * @param {Object} props
 * @param {string} props.dateStr
 * @param {string} props.locale
 * @param {boolean} [props.includeYear=true]
 * @param {boolean|"card"} [props.fullFormat=false] - true: "30 November 2025", "card": "Sunday, April 14, 2024"
 */
export const FormattedDate = ({
	dateStr,
	locale,
	includeYear = true,
	fullFormat = false,
}) => {
	const date = dateStr ? parseNaive(dateStr) : null
	if (!date) {
		return null
	}

	const selectedLocale = locales[locale] || enCA

	// Full date format: "30 November 2025"
	if (fullFormat === true) {
		const fullDate = format(date, "d MMMM yyyy", {
			locale: selectedLocale,
		})
		return <>{fullDate}</>
	}

	// Card format: "Sunday, April 14, 2024" (fullFormat="card")
	if (fullFormat === "card") {
		const cardDate = format(date, "EEEE, MMMM d, yyyy", {
			locale: selectedLocale,
		})
		return <>{cardDate}</>
	}

	// Abbreviated format (default)
	const dayName = format(date, "EEE", { locale: selectedLocale }) // Day name
	const day = format(date, "d", { locale: selectedLocale }) // Day number
	const monthYear = includeYear
		? format(date, "MMM ''yy", { locale: selectedLocale }) // Month and year
		: format(date, "MMM", { locale: selectedLocale }) // Month only

	return (
		<>
			<span>{dayName}</span>
			<span>{day}</span>
			<span>{monthYear}</span>
		</>
	)
}

// Function to format the time (hours and minutes)
export const FormattedTime = ({ dateStr, locale }) => {
	const date = dateStr ? parseNaive(dateStr) : null
	if (!date) {
		return null
	}

	// Define locale fallback
	const selectedLocale = locales[locale] || enCA

	// 24-hour format everywhere ("19:00")
	const formattedTime = format(date, "HH:mm", {
		locale: selectedLocale,
	})

	return <>{formattedTime}</>
}
