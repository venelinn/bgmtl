import { format } from "date-fns"
import { bg, enCA, frCA } from "date-fns/locale"
import { toZonedTime } from "date-fns-tz"

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
	if (!dateStr) {
		return null
	}

	const selectedLocale = locales[locale] || enCA

	// Full date format: "30 November 2025"
	if (fullFormat === true) {
		const fullDate = format(new Date(dateStr), "d MMMM yyyy", {
			locale: selectedLocale,
		})
		return <>{fullDate}</>
	}

	// Card format: "Sunday, April 14, 2024" (fullFormat="card")
	if (fullFormat === "card") {
		const cardDate = format(new Date(dateStr), "EEEE, MMMM d, yyyy", {
			locale: selectedLocale,
		})
		return <>{cardDate}</>
	}

	// Abbreviated format (default)
	const dayName = format(new Date(dateStr), "EEE", { locale: selectedLocale }) // Day name
	const day = format(new Date(dateStr), "d", { locale: selectedLocale }) // Day number
	const monthYear = includeYear
		? format(new Date(dateStr), "MMM ''yy", { locale: selectedLocale }) // Month and year
		: format(new Date(dateStr), "MMM", { locale: selectedLocale }) // Month only

	return (
		<>
			<span>{dayName}</span>
			<span>{day}</span>
			<span>{monthYear}</span>
		</>
	)
}

// Function to format the time (hours and minutes)
export const FormattedTime = ({
	dateStr,
	locale,
	timezone = "America/Toronto",
}) => {
	if (!dateStr) {
		return null
	}

	// Define locale fallback
	const selectedLocale = locales[locale] || enCA

	// Parse the date as a zoned time
	const zonedDate = toZonedTime(dateStr, timezone)

	// Format the time in 12-hour format with AM/PM
	const formattedTime = format(zonedDate, "hh:mm a", {
		locale: selectedLocale,
	})

	return <>{formattedTime}</>
}
