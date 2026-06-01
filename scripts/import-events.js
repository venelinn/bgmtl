#!/usr/bin/env node

require("dotenv").config()

/**
 * Script to import events from mockData/events/*.json to Contentful
 * Usage: node scripts/import-events.js <filename>
 *   e.g. node scripts/import-events.js 2024.json
 *   e.g. node scripts/import-events.js 2024
 *
 * Environment variables (from .env):
 * - CONTENTFUL_MANAGEMENT_TOKEN (required)
 * - CONTENTFUL_SPACE_ID (default: huajfyusfsch)
 * - CONTENTFUL_ENVIRONMENT (default: master)
 */

const fs = require("fs")
const path = require("path")
const { createClient } = require("contentful-management")

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch"
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master"
const DEFAULT_LOCALE = "bg-BG"
const FALLBACK_LOCALE = "en-CA"

const ensureRichTextNodeData = (node) => {
	if (!node || typeof node !== "object") {
		return node
	}

	if (!Object.hasOwn(node, "data")) {
		node.data = {}
	}

	if (node.nodeType === "text") {
		if (!Array.isArray(node.marks)) {
			node.marks = []
		}
	}

	if (Array.isArray(node.content)) {
		node.content = node.content.map((child) => ensureRichTextNodeData(child))
	}

	return node
}

const normalizeRichTextValue = (value) => {
	if (!value || typeof value !== "object") {
		return value
	}

	const clone = JSON.parse(JSON.stringify(value))
	return ensureRichTextNodeData(clone)
}

const getLocalizedValue = (value) => {
	if (!value || typeof value !== "object") {
		return value
	}

	if (Object.hasOwn(value, DEFAULT_LOCALE)) {
		return value[DEFAULT_LOCALE]
	}

	if (Object.hasOwn(value, FALLBACK_LOCALE)) {
		return value[FALLBACK_LOCALE]
	}

	return value
}

const normalizeFieldValue = (fieldDef, fieldValue) => {
	if (fieldValue === null || fieldValue === undefined) {
		return undefined
	}

	const isLocalized = fieldDef.localized === true

	if (fieldDef.type === "RichText") {
		if (isLocalized) {
			if (
				fieldValue &&
				typeof fieldValue === "object" &&
				!Array.isArray(fieldValue) &&
				!fieldValue.sys
			) {
				const normalized = {}
				Object.entries(fieldValue).forEach(([locale, value]) => {
					normalized[locale] = normalizeRichTextValue(value)
				})
				return normalized
			}

			return {
				[DEFAULT_LOCALE]: normalizeRichTextValue(fieldValue),
			}
		}

		return {
			[DEFAULT_LOCALE]: normalizeRichTextValue(getLocalizedValue(fieldValue)),
		}
	}

	if (fieldDef.type === "Location") {
		const locationValue = isLocalized
			? getLocalizedValue(fieldValue)
			: fieldValue

		if (!locationValue || typeof locationValue !== "object") {
			return undefined
		}

		const { lat, lon } = locationValue
		if (typeof lat !== "number" || typeof lon !== "number") {
			return undefined
		}

		return { [DEFAULT_LOCALE]: { lat, lon } }
	}

	if (isLocalized) {
		if (
			fieldValue &&
			typeof fieldValue === "object" &&
			!Array.isArray(fieldValue) &&
			!fieldValue.sys
		) {
			return fieldValue
		}

		return { [DEFAULT_LOCALE]: fieldValue }
	}

	return { [DEFAULT_LOCALE]: getLocalizedValue(fieldValue) }
}

// Parse filename from args (e.g. 2024 or 2024.json)
const inputArg = process.argv[2]
if (!inputArg) {
	console.error("❌ Error: filename is required")
	console.error("Usage: node scripts/import-events.js <filename>")
	console.error("  e.g. node scripts/import-events.js 2024.json")
	console.error("  e.g. node scripts/import-events.js 2024")
	process.exit(1)
}
const EVENTS_FILENAME = inputArg.endsWith(".json") ? inputArg : `${inputArg}.json`

console.log("📋 Configuration:")
console.log(`   File: mockData/events/${EVENTS_FILENAME}`)
console.log(`   Space ID: ${SPACE_ID}`)
console.log(`   Environment: ${ENVIRONMENT}`)
console.log(`   Token loaded: ${MANAGEMENT_TOKEN ? "✅ Yes" : "❌ No"}`)
console.log(`   Token length: ${MANAGEMENT_TOKEN?.length || 0}`)

if (!MANAGEMENT_TOKEN) {
	console.error(
		"❌ Error: CONTENTFUL_MANAGEMENT_TOKEN environment variable is required",
	)
	console.error(
		"Usage: CONTENTFUL_MANAGEMENT_TOKEN=your_token node scripts/import-events.js <filename>",
	)
	process.exit(1)
}

async function importEvents() {
	try {
		// Initialize Contentful Management client
		const client = createClient(
			{
				accessToken: MANAGEMENT_TOKEN,
			},
			{ type: "legacy" },
		)

		// Get space and environment
		const space = await client.getSpace(SPACE_ID)
		const environment = await space.getEnvironment(ENVIRONMENT)

		// Load content types to filter fields
		const eventContentType = await environment.getContentType("event")
		const eventFieldById = new Map(
			eventContentType.fields.map((field) => [field.id, field]),
		)

		const headingContentType = await environment.getContentType("heading")
		const headingFieldById = new Map(
			headingContentType.fields.map((field) => [field.id, field]),
		)

		// Read the mock data file
		const eventsFilePath = path.join(__dirname, "../mockData/events", EVENTS_FILENAME)
		if (!fs.existsSync(eventsFilePath)) {
			console.error(`❌ Error: file not found: mockData/events/${EVENTS_FILENAME}`)
			process.exit(1)
		}
		const eventsData = JSON.parse(fs.readFileSync(eventsFilePath, "utf8"))

		const headingsData = eventsData?.headings?.items || []
		const headingsTotal = eventsData?.headings?.total ?? headingsData.length
		const eventsItems = eventsData?.events?.items || []
		const eventsTotal = eventsData?.events?.total ?? eventsItems.length

		// First, import all headings
		console.log(`\n📥 Importing ${headingsTotal} headings from ${EVENTS_FILENAME}...`)
		let headingSuccessCount = 0
		let headingErrorCount = 0

		for (let i = 0; i < headingsData.length; i++) {
			const headingData = headingsData[i]

			try {
				const { sys, fields } = headingData

				// Prepare entry data
				const entryData = {
					fields: {},
				}

				// Transform fields to Contentful format
				Object.entries(fields).forEach(([fieldName, fieldValue]) => {
					const fieldDef = headingFieldById.get(fieldName)
					if (!fieldDef) {
						return
					}

					const normalizedValue = normalizeFieldValue(fieldDef, fieldValue)
					if (normalizedValue === undefined) {
						return
					}

					entryData.fields[fieldName] = normalizedValue
				})

				// Create the heading entry with a specific ID
				const entry = await environment.createEntryWithId(
					"heading",
					sys.id,
					entryData,
				)

				// Publish the entry
				await entry.publish()

				console.log(`✅ [${i + 1}/${headingsTotal}] Heading created: ${sys.id}`)
				headingSuccessCount++
			} catch (error) {
				console.error(
					`❌ [${i + 1}/${headingsTotal}] Error importing heading ${headingData?.sys?.id}:`,
					error.message,
				)
				headingErrorCount++
			}
		}

		// Then, import events
		console.log(`\n📥 Importing ${eventsTotal} events from ${EVENTS_FILENAME}...`)
		console.log(`📍 Space: ${SPACE_ID}, Environment: ${ENVIRONMENT}\n`)

		let eventSuccessCount = 0
		let eventErrorCount = 0

		// Process each event
		for (let i = 0; i < eventsItems.length; i++) {
			const eventData = eventsItems[i]

			try {
				const { sys, fields } = eventData

				// Prepare entry data
				const entryData = {
					fields: {},
				}

				// Transform fields to Contentful format (handle both localized and non-localized)
				Object.entries(fields).forEach(([fieldName, fieldValue]) => {
					const fieldDef = eventFieldById.get(fieldName)
					if (!fieldDef) {
						return
					}

					const normalizedValue = normalizeFieldValue(fieldDef, fieldValue)
					if (normalizedValue === undefined) {
						return
					}

					entryData.fields[fieldName] = normalizedValue
				})

				// Create the entry with a specific ID
				const entry = await environment.createEntryWithId(
					"event",
					sys.id,
					entryData,
				)

				// Publish the entry
				await entry.publish()

				console.log(
					`✅ [${i + 1}/${eventsTotal}] Imported & published: ${sys.id}`,
				)
				eventSuccessCount++
			} catch (error) {
				console.error(
					`❌ [${i + 1}/${eventsTotal}] Error importing ${eventData?.sys?.id}:`,
					error.message,
				)
				eventErrorCount++
			}
		}

		console.log(`\n✨ Import complete!`)
		console.log(
			`📋 Headings: ✅ ${headingSuccessCount} ❌ ${headingErrorCount}`,
		)
		console.log(`📋 Events: ✅ ${eventSuccessCount} ❌ ${eventErrorCount}\n`)

		process.exit(headingErrorCount > 0 || eventErrorCount > 0 ? 1 : 0)
	} catch (error) {
		console.error("❌ Fatal error:", error.message)
		process.exit(1)
	}
}

importEvents()
