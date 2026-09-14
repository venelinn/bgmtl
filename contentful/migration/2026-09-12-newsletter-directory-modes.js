/**
 * Adds the two community-directory content modes to the `newsletter` type:
 * `directory` (latest listings only) and `eventsAndDirectory` (upcoming events
 * + latest listings). The renderer/data layers already understand them — this
 * just opens them up in the CMS dropdown.
 *
 * Run: node scripts/run-migration.js contentful/migration/2026-09-12-newsletter-directory-modes.js
 */
module.exports = (migration) => {
	const newsletter = migration.editContentType("newsletter")

	newsletter.editField("contentMode").validations([
		{
			in: [
				"upcomingEvents",
				"selectedEvents",
				"news",
				"eventsAndNews",
				"directory",
				"eventsAndDirectory",
			],
		},
	])

	newsletter.changeFieldControl("contentMode", "builtin", "dropdown", {
		helpText:
			"upcomingEvents = all upcoming · selectedEvents = only the events below · news = latest news · eventsAndNews = both · directory = newest community listings · eventsAndDirectory = upcoming events + newest listings.",
	})
}
