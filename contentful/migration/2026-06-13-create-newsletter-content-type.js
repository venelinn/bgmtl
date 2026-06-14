/**
 * Creates the "newsletter" content type — one entry per newsletter issue.
 *
 * Publishing an entry triggers the Contentful webhook → /api/newsletter, which
 * builds the HTML and creates a Brevo DRAFT campaign for manual review + send.
 * See docs/newsletter.md.
 *
 * Usage:
 *   node scripts/run-migration.js contentful/migration/2026-06-13-create-newsletter-content-type.js
 */
module.exports = (migration) => {
	const newsletter = migration
		.createContentType("newsletter")
		.name("Newsletter")
		.description("A newsletter issue → builds a Brevo draft on publish. See docs/newsletter.md")
		.displayField("title")

	newsletter
		.createField("title")
		.name("Title (internal)")
		.type("Symbol")
		.required(true)

	newsletter
		.createField("subject")
		.name("Email subject")
		.type("Symbol")
		.required(true)

	newsletter
		.createField("preheader")
		.name("Preheader (inbox preview text)")
		.type("Symbol")
		.required(false)

	newsletter
		.createField("intro")
		.name("Intro text")
		.type("Text")
		.required(false)

	newsletter
		.createField("contentMode")
		.name("Content mode")
		.type("Symbol")
		.required(true)
		.validations([
			{ in: ["upcomingEvents", "selectedEvents", "news", "eventsAndNews"] },
		])
		.defaultValue({ "bg-BG": "upcomingEvents" })

	newsletter
		.createField("events")
		.name("Events (for the 'selectedEvents' mode)")
		.type("Array")
		.required(false)
		.items({
			type: "Link",
			linkType: "Entry",
			validations: [{ linkContentType: ["event"] }],
		})

	newsletter
		.createField("maxItems")
		.name("Max items per section")
		.type("Integer")
		.required(false)

	// Field controls
	newsletter.changeFieldControl("title", "builtin", "singleLine", {
		helpText: "Internal label only — not shown in the email.",
	})
	newsletter.changeFieldControl("subject", "builtin", "singleLine", {})
	newsletter.changeFieldControl("preheader", "builtin", "singleLine", {
		helpText: "Short teaser shown in the inbox preview. Optional.",
	})
	newsletter.changeFieldControl("intro", "builtin", "multipleLine", {
		helpText: "Greeting paragraphs. Separate paragraphs with a blank line. Leave empty for the default.",
	})
	newsletter.changeFieldControl("contentMode", "builtin", "dropdown", {
		helpText:
			"upcomingEvents = all upcoming · selectedEvents = only the events below · news = latest news · eventsAndNews = both.",
	})
	newsletter.changeFieldControl("events", "builtin", "entryLinksEditor", {
		helpText: "Used only when content mode is 'selectedEvents'. Order here = order in the email.",
	})
	newsletter.changeFieldControl("maxItems", "builtin", "numberEditor", {
		helpText: "Optional cap per section (default 8).",
	})
}
