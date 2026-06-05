#!/usr/bin/env node

require("dotenv").config();

/**
 * Script to import BG Community in Canada data from mockData/bg-community/bg-community-in-canada.json
 * Usage: node scripts/import-bg-community.js
 *
 * Environment variables (from .env):
 * - CONTENTFUL_MANAGEMENT_TOKEN (required)
 * - CONTENTFUL_SPACE_ID (default: huajfyusfsch)
 * - CONTENTFUL_ENVIRONMENT (default: master)
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("contentful-management");

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "huajfyusfsch";
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.CONTENTFUL_ENVIRONMENT || "master";
const DEFAULT_LOCALE = "bg-BG";
const FALLBACK_LOCALE = "en-CA";
const VALID_LOCALES = new Set(["en-CA", "bg-BG"]);

const ensureRichTextNodeData = (node) => {
	if (!node || typeof node !== "object") return node;
	if (!Object.hasOwn(node, "data")) node.data = {};
	if (node.nodeType === "text" && !Array.isArray(node.marks)) node.marks = [];
	if (Array.isArray(node.content)) node.content = node.content.map((child) => ensureRichTextNodeData(child));
	return node;
};

const normalizeRichTextValue = (value) => {
	if (!value || typeof value !== "object") return value;
	const clone = JSON.parse(JSON.stringify(value));
	return ensureRichTextNodeData(clone);
};

/** Strip invalid keys (e.g. linkUrl, linkName) that may be nested inside content in mockData */
const sanitizeLocalizedRichText = (value) => {
	if (!value || typeof value !== "object" || Array.isArray(value) || value?.sys) return value;
	const sanitized = {};
	for (const [key, val] of Object.entries(value)) {
		if (VALID_LOCALES.has(key)) sanitized[key] = normalizeRichTextValue(val);
	}
	return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const getLocalizedValue = (value) => {
	if (!value || typeof value !== "object") return value;
	if (Object.hasOwn(value, DEFAULT_LOCALE)) return value[DEFAULT_LOCALE];
	if (Object.hasOwn(value, FALLBACK_LOCALE)) return value[FALLBACK_LOCALE];
	return value;
};

const normalizeFieldValue = (fieldDef, fieldValue) => {
	if (fieldValue === null || fieldValue === undefined) return undefined;
	const isLocalized = fieldDef.localized === true;

	if (fieldDef.type === "RichText") {
		if (isLocalized) {
			if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue) && !fieldValue.sys) {
				const normalized = {};
				Object.entries(fieldValue).forEach(([locale, value]) => {
					normalized[locale] = normalizeRichTextValue(value);
				});
				return normalized;
			}
			return { [DEFAULT_LOCALE]: normalizeRichTextValue(getLocalizedValue(fieldValue)) };
		}
		return { [DEFAULT_LOCALE]: normalizeRichTextValue(getLocalizedValue(fieldValue)) };
	}

	if (fieldDef.type === "Link" && fieldDef.linkType === "Entry") {
		const linkId = fieldValue?.sys?.id ?? fieldValue?.id;
		if (!linkId) return undefined;
		return { [DEFAULT_LOCALE]: { sys: { type: "Link", linkType: "Entry", id: linkId } } };
	}

	if (fieldDef.type === "Array" && fieldDef.items?.linkType === "Entry") {
		if (!Array.isArray(fieldValue)) return undefined;
		const links = fieldValue
			.map((c) => c?.sys?.id ?? c?.id)
			.filter(Boolean)
			.map((id) => ({ sys: { type: "Link", linkType: "Entry", id } }));
		if (links.length === 0) return undefined;
		return { [DEFAULT_LOCALE]: links };
	}

	if (isLocalized) {
		if (fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue) && !fieldValue.sys) {
			return fieldValue;
		}
		return { [DEFAULT_LOCALE]: fieldValue };
	}

	return { [DEFAULT_LOCALE]: getLocalizedValue(fieldValue) };
};

const buildEntryFields = (fieldDefById, data) => {
	const entryData = { fields: {} };
	Object.entries(data).forEach(([fieldName, fieldValue]) => {
		const fieldDef = fieldDefById.get(fieldName);
		if (!fieldDef) return;
		const normalized = normalizeFieldValue(fieldDef, fieldValue);
		if (normalized !== undefined) entryData.fields[fieldName] = normalized;
	});
	return entryData;
};

console.log("📋 Configuration:");
console.log(`   Space ID: ${SPACE_ID}`);
console.log(`   Environment: ${ENVIRONMENT}`);
console.log(`   Token loaded: ${MANAGEMENT_TOKEN ? "✅ Yes" : "❌ No"}`);

if (!MANAGEMENT_TOKEN) {
	console.error("❌ Error: CONTENTFUL_MANAGEMENT_TOKEN environment variable is required");
	process.exit(1);
}

async function importBgCommunity() {
	try {
		const client = createClient(
			{ accessToken: MANAGEMENT_TOKEN },
			{ type: "legacy" },
		);
		const space = await client.getSpace(SPACE_ID);
		const environment = await space.getEnvironment(ENVIRONMENT);

		const headingContentType = await environment.getContentType("heading");
		const cardContentType = await environment.getContentType("card");
		const collectionContentType = await environment.getContentType("collection");

		const headingFieldById = new Map(headingContentType.fields.map((f) => [f.id, f]));
		const cardFieldById = new Map(cardContentType.fields.map((f) => [f.id, f]));
		const collectionFieldById = new Map(collectionContentType.fields.map((f) => [f.id, f]));

		const dataPath = path.join(__dirname, "../mockData/bg-community/bg-community-in-canada.json");
		const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

		const allHeadings = [...(data.headings || [])];
		const cards = data.infoCards || [];
		const collections = data.collections || [];

		// Collect card headings (headingEntry is inside fields in mockData)
		cards.forEach((card) => {
			const headingEntry = card.fields?.headingEntry ?? card.headingEntry;
			if (headingEntry?.sys?.id && !allHeadings.some((h) => h.sys.id === headingEntry.sys.id)) {
				allHeadings.push(headingEntry);
			}
		});

		// 1. Create headings (must exist before cards and collections)
		console.log(`\n📥 Importing ${allHeadings.length} headings...`);
		for (const item of allHeadings) {
			try {
				const { sys, fields } = item;
				const entryData = buildEntryFields(headingFieldById, fields);
				let entry;
				try {
					entry = await environment.getEntry(sys.id);
					for (const [fieldName, fieldValue] of Object.entries(entryData.fields)) {
						entry.fields[fieldName] = fieldValue;
					}
					await entry.update();
				} catch {
					await environment.createEntryWithId("heading", sys.id, entryData);
					entry = await environment.getEntry(sys.id);
				}
				if (!entry.isPublished()) await entry.publish();
				console.log(`✅ Heading: ${sys.id}`);
			} catch (err) {
				console.error(`❌ Heading ${item?.sys?.id}:`, err.message);
			}
		}

		// 2. Create cards (content type: card) - headings must exist first
		console.log(`\n📥 Importing ${cards.length} cards...`);
		for (const item of cards) {
			try {
				const { sys, fields } = item;
				const cardFields = {
					title: fields.title,
					variant: { [DEFAULT_LOCALE]: "primary" },
					content: sanitizeLocalizedRichText(fields.content),
					heading: fields.heading,
				};
				const entryData = buildEntryFields(cardFieldById, cardFields);
				let entry;
				try {
					entry = await environment.getEntry(sys.id);
					for (const [fieldName, fieldValue] of Object.entries(entryData.fields)) {
						entry.fields[fieldName] = fieldValue;
					}
					await entry.update();
				} catch {
					await environment.createEntryWithId("card", sys.id, entryData);
					entry = await environment.getEntry(sys.id);
				}
				if (!entry.isPublished()) await entry.publish();
				console.log(`✅ Card: ${sys.id}`);
			} catch (err) {
				console.error(`❌ Card ${item?.sys?.id}:`, err.message);
			}
		}

		// 3. Create collections (cards must exist first)
		console.log(`\n📥 Importing ${collections.length} collections...`);
		for (const item of collections) {
			try {
				const { sys, fields } = item;
				const collectionFields = {
					title: fields.title,
					heading: fields.heading,
					cardVariant: fields.cardVariant,
					variant: fields.variant,
					itemsPerRow: fields.itemsPerRow,
					cards: fields.cards,
				};
				const entryData = buildEntryFields(collectionFieldById, collectionFields);
				let entry;
				try {
					entry = await environment.getEntry(sys.id);
					for (const [fieldName, fieldValue] of Object.entries(entryData.fields)) {
						entry.fields[fieldName] = fieldValue;
					}
					await entry.update();
				} catch {
					await environment.createEntryWithId("collection", sys.id, entryData);
					entry = await environment.getEntry(sys.id);
				}
				if (!entry.isPublished()) await entry.publish();
				console.log(`✅ Collection: ${sys.id}`);
			} catch (err) {
				console.error(`❌ Collection ${item?.sys?.id}:`, err.message);
			}
		}

		console.log("\n✨ Import complete!");
	} catch (err) {
		console.error("❌ Fatal error:", err.message);
		process.exit(1);
	}
}

importBgCommunity();
