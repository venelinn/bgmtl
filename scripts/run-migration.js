#!/usr/bin/env node

require("dotenv").config()
const path = require("path")
const { execFileSync } = require("child_process")

const migrationFile =
	process.argv[2] || "contentful/migration/2026-02-25-import-bg-community.js"
const migrationPath = path.resolve(process.cwd(), migrationFile)
const spaceId = process.env.CONTENTFUL_SPACE_ID
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master"
const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN
// Pass --yes to auto-confirm the migration plan (set NON_INTERACTIVE=0 to review).
const autoConfirm = process.env.NON_INTERACTIVE !== "0"

if (!spaceId || !managementToken) {
	console.error(
		"Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in .env",
	)
	process.exit(1)
}

// Local contentful CLI binary (devDependency). execFileSync (not execSync) so the
// argument array is passed correctly rather than being misread as options.
const cli = path.join(__dirname, "..", "node_modules", ".bin", "contentful")

execFileSync(
	cli,
	[
		"space",
		"migration",
		"--space-id",
		spaceId,
		"--environment-id",
		environmentId,
		"--management-token",
		managementToken,
		...(autoConfirm ? ["--yes"] : []),
		migrationPath,
	],
	{ stdio: "inherit" },
)
