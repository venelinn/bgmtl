// Use 'export const' instead of 'module.exports'

export const localization = {
	contentfulLocales: ["bg-BG", "en-CA", "fr-CA"],
	locales: ["bg", "en", "fr"],
	defaultLocale: "bg",
}

/** Human-readable language names, keyed by the short locale code. */
export const localeNames: Record<string, string> = {
	bg: "Български",
	en: "English",
	fr: "Français",
}

/**
 * flag-icons country codes (ISO 3166-1 alpha-2) per locale, used as
 * `fi fi-${code}`. flag-icons has no Quebec subdivision flag, so French uses
 * France; English uses Canada per the NCR audience. Edit here to re-map.
 */
export const localeFlags: Record<string, string> = {
	bg: "bg",
	en: "ca",
	fr: "fr",
}

export const getContentfulLocale = (locale: string) => {
	const index = localization.locales.indexOf(locale)
	if (index !== -1) {
		return localization.contentfulLocales[index]
	}
	// Fallback to the first locale if not found
	return localization.contentfulLocales[0]
}

// Export all properties as a default object for convenience,
// just like your old file did.
