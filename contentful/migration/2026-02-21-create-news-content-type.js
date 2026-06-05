/**
 * Creates "news" content type - similar to event but simpler (no venue, address, etc.)
 * Fields: heading, date, cover, excerpt, content
 *
 * Usage:
 *   contentful space migration --environment-id master --space-id YOUR_SPACE_ID contentful/migration/2026-02-21-create-news-content-type.js
 *
 * If "news" already exists, use 2026-02-21-add-news-fields-if-missing.js instead.
 */
module.exports = (migration) => {
	const news = migration
		.createContentType("news")
		.name("News")
		.description("News article - simpler than Event, with heading, date, cover, excerpt, content")
		.displayField("title")

	news.createField("title").name("Title").type("Symbol").required(true)

	news
		.createField("heading")
		.name("Heading")
		.type("Link")
		.linkType("Entry")
		.validations([{ linkContentType: ["heading"] }])
		.required(true)

	news.createField("date").name("Date").type("Date").required(true)

	news.createField("cover").name("Cover").type("Object").required(false)

	news
		.createField("excerpt")
		.name("Excerpt")
		.type("RichText")
		.required(false)
		.validations([{ enabledMarks: ["bold"] }])

	news
		.createField("content")
		.name("Content")
		.type("RichText")
		.required(false)
		.validations([{ enabledMarks: ["bold"] }])
}
