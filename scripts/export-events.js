#!/usr/bin/env node

require("dotenv").config()

/**
 * Script to export current event entries from Contentful
 * Usage: node scripts/export-events.js
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

if (!MANAGEMENT_TOKEN) {
	console.error(
		"❌ Error: CONTENTFUL_MANAGEMENT_TOKEN environment variable is required",
	)
	process.exit(1)
}

async function exportEvents() {
	try {
		const client = createClient(
			{ accessToken: MANAGEMENT_TOKEN },
			{ type: "legacy" },
		)
		const space = await client.getSpace(SPACE_ID)
		const environment = await space.getEnvironment(ENVIRONMENT)

		const entries = await environment.getEntries({
			content_type: "event",
			limit: 1000,
		})

		// Collect all heading IDs from events
		const headingIds = new Set()
		entries.items.forEach((item) => {
			const heading = item.fields.heading
			if (heading) {
				Object.values(heading).forEach((localeValue) => {
					if (localeValue?.sys?.id) {
						headingIds.add(localeValue.sys.id)
					}
				})
			}
		})

		// Fetch all referenced heading entries
		const headings = []
		if (headingIds.size > 0) {
			const headingEntries = await environment.getEntries({
				content_type: "heading",
				"sys.id[in]": Array.from(headingIds).join(","),
				limit: 1000,
			})
			headings.push(
				...headingEntries.items.map((item) => ({
					sys: {
						id: item.sys.id,
						contentType: item.sys.contentType?.sys?.id,
						createdAt: item.sys.createdAt,
						updatedAt: item.sys.updatedAt,
						publishedAt: item.sys.publishedAt,
					},
					fields: item.fields,
				})),
			)
		}

		const output = {
			retrievedAt: new Date().toISOString(),
			spaceId: SPACE_ID,
			environment: ENVIRONMENT,
			events: {
				total: entries.items.length,
				items: entries.items.map((item) => ({
					sys: {
						id: item.sys.id,
						contentType: item.sys.contentType?.sys?.id,
						createdAt: item.sys.createdAt,
						updatedAt: item.sys.updatedAt,
						publishedAt: item.sys.publishedAt,
					},
					fields: item.fields,
				})),
			},
			headings: {
				total: headings.length,
				items: headings,
			},
		}

		const outputPath = path.join(
			__dirname,
			"../contentful/exports/events-current.json",
		)

		fs.mkdirSync(path.dirname(outputPath), { recursive: true })
		fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8")

		console.log(
			`✅ Exported ${output.events.total} events and ${output.headings.total} headings to ${outputPath}`,
		)
	} catch (error) {
		console.error("❌ Export failed:", error.message)
		process.exit(1)
	}
}

exportEvents()
