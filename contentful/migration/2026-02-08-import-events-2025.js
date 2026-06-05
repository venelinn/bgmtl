/**
 * Migration to import events from mockData/events/2025.json
 * Usage: npm run contentful:migrate -- --file=contentful/migration/2026-02-08-import-events-2025.js
 */

const fs = require("fs")
const path = require("path")

module.exports = async (migration) => {
	// Read the mock data file
	const eventsFilePath = path.join(__dirname, "../../mockData/events/2025.json")
	const eventsData = JSON.parse(fs.readFileSync(eventsFilePath, "utf8"))

	console.log(`📥 Importing ${eventsData.length} events from 2025.json...`)

	// Process each event
	eventsData.forEach((eventData, index) => {
		try {
			const { sys, fields } = eventData

			// Create event entry with content type "event"
			const entry = migration.createEntry("event", {
				id: sys.id,
			})

			// Set all localized fields
			if (fields.title) {
				Object.entries(fields.title).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("title", value)
				})
			}

			if (fields.heading) {
				Object.entries(fields.heading).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("heading", value)
				})
			}

			if (fields.date) {
				Object.entries(fields.date).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("date", value)
				})
			}

			if (fields.doorsOpen) {
				Object.entries(fields.doorsOpen).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("doorsOpen", value)
				})
			}

			if (fields.venue) {
				Object.entries(fields.venue).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("venue", value)
				})
			}

			if (fields.address) {
				Object.entries(fields.address).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("address", value)
				})
			}

			if (fields.excerpt) {
				Object.entries(fields.excerpt).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("excerpt", value)
				})
			}

			if (fields.content) {
				Object.entries(fields.content).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("content", value)
				})
			}

			if (fields.cover) {
				Object.entries(fields.cover).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("cover", value)
				})
			}

			if (fields.ticket) {
				Object.entries(fields.ticket).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("ticket", value)
				})
			}

			if (fields.venueLogo) {
				Object.entries(fields.venueLogo).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("venueLogo", value)
				})
			}

			if (fields.gallery) {
				Object.entries(fields.gallery).forEach(([locale, value]) => {
					entry.setLocale(locale).setFieldValue("gallery", value)
				})
			}

			// Handle nested heading entry if present
			if (fields.headingEntry) {
				const headingEntry = migration.createEntry("heading", {
					id: fields.headingEntry.sys.id,
				})

				const headingFields = fields.headingEntry.fields

				if (headingFields.title) {
					Object.entries(headingFields.title).forEach(([locale, value]) => {
						headingEntry.setLocale(locale).setFieldValue("title", value)
					})
				}

				if (headingFields.heading) {
					Object.entries(headingFields.heading).forEach(([locale, value]) => {
						headingEntry.setLocale(locale).setFieldValue("heading", value)
					})
				}

				if (headingFields.headingAs) {
					Object.entries(headingFields.headingAs).forEach(([locale, value]) => {
						headingEntry.setLocale(locale).setFieldValue("headingAs", value)
					})
				}

				// Link the heading entry to the event
				entry.setLocale("en-CA").linkField("heading", headingEntry)
				entry.setLocale("bg-BG").linkField("heading", headingEntry)
			}

			// Publish the entry
			migration.publishEntry(sys.id)

			console.log(
				`✅ [${index + 1}/${eventsData.length}] Imported event: ${sys.id}`,
			)
		} catch (error) {
			console.error(
				`❌ Error importing event at index ${index}:`,
				error.message,
			)
		}
	})

	console.log(`\n✨ Import complete! ${eventsData.length} events processed.`)
}

// npm run contentful:migrate -- --file=contentful/migration/2026-02-08-import-events-2025.js
