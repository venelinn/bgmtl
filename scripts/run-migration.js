#!/usr/bin/env node

require("dotenv").config();
const path = require("path");
const { execSync } = require("child_process");

const migrationFile = process.argv[2] || "contentful/migration/2026-02-25-import-bg-community.js";
const migrationPath = path.resolve(process.cwd(), migrationFile);
const spaceId = process.env.CONTENTFUL_SPACE_ID;
const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!spaceId || !managementToken) {
	console.error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in .env");
	process.exit(1);
}

execSync("contentful", [
	"space",
	"migration",
	"--space-id",
	spaceId,
	"--management-token",
	managementToken,
	migrationPath,
], { stdio: "inherit" });
