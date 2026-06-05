/**
 * Migration to import BG Community in Canada data from mockData/bg-community/bg-community-in-canada.json
 *
 * Creates: headings, cards, collections (with cardVariant: info)
 *
 *
 * Usage: pnpm run contentful:migrate -- contentful/migration/2026-02-25-import-bg-community.js
 */

const fs = require("fs");
const path = require("path");

function setLocalizedFields(entry, fields, fieldNames) {
	fieldNames.forEach((fieldName) => {
		const value = fields[fieldName];
		if (!value || typeof value !== "object" || value.sys) return;
		Object.entries(value).forEach(([locale, val]) => {
			if (val !== undefined && val !== null) {
				entry.setLocale(locale).setFieldValue(fieldName, val);
			}
		});
	});
}

module.exports = async (migration) => {
	const dataPath = path.join(__dirname, "../../mockData/bg-community/bg-community-in-canada.json");
	const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

	const allHeadings = [...(data.headings || [])];
	const cards = data.infoCards || [];
	const collections = data.collections || [];

	// Collect heading entries from cards
	cards.forEach((card) => {
		if (card.headingEntry && !allHeadings.find((h) => h.sys.id === card.headingEntry.sys.id)) {
			allHeadings.push(card.headingEntry);
		}
	});

	const createdEntries = new Map();

	// 1. Create all heading entries
	console.log(`📥 Creating ${allHeadings.length} heading entries...`);
	allHeadings.forEach((item) => {
		const { sys, fields } = item;
		const headingEntry = migration.createEntry("heading", { id: sys.id });

		if (fields.title) {
			Object.entries(fields.title).forEach(([locale, value]) => {
				headingEntry.setLocale(locale).setFieldValue("title", value);
			});
		}
		if (fields.heading) {
			Object.entries(fields.heading).forEach(([locale, value]) => {
				headingEntry.setLocale(locale).setFieldValue("heading", value);
			});
		}
		if (fields.as) {
			Object.entries(fields.as).forEach(([locale, value]) => {
				headingEntry.setLocale(locale).setFieldValue("as", value);
			});
		}
		if (fields.size) {
			Object.entries(fields.size).forEach(([locale, value]) => {
				headingEntry.setLocale(locale).setFieldValue("size", value);
			});
		}

		migration.publishEntry(sys.id);
		createdEntries.set(sys.id, headingEntry);
	});

	// 2. Create all card entries (variant: info for InfoCard display)
	console.log(`📥 Creating ${cards.length} card entries...`);
	cards.forEach((item) => {
		const { sys, fields } = item;
		const cardEntry = migration.createEntry("card", { id: sys.id });

		cardEntry.setLocale("en-CA").setFieldValue("variant", "primary");
		setLocalizedFields(cardEntry, fields, ["title", "content"]);

		if (fields.heading?.sys?.id) {
			const headingEntry = createdEntries.get(fields.heading.sys.id);
			if (headingEntry) {
				["en-CA", "bg-BG"].forEach((locale) => {
					cardEntry.setLocale(locale).linkField("heading", headingEntry);
				});
			}
		}

		migration.publishEntry(sys.id);
		createdEntries.set(sys.id, cardEntry);
	});

	// 3. Create all collection entries
	console.log(`📥 Creating ${collections.length} collection entries...`);
	collections.forEach((item) => {
		const { sys, fields } = item;
		const collectionEntry = migration.createEntry("collection", { id: sys.id });

		if (fields.title) {
			Object.entries(fields.title).forEach(([locale, value]) => {
				collectionEntry.setLocale(locale).setFieldValue("title", value);
			});
		}

		if (fields.heading?.sys?.id) {
			const headingEntry = createdEntries.get(fields.heading.sys.id);
			if (headingEntry) {
				["en-CA", "bg-BG"].forEach((locale) => {
					collectionEntry.setLocale(locale).linkField("heading", headingEntry);
				});
			}
		}

		if (fields.cardVariant) {
			const val = fields.cardVariant["en-CA"] ?? fields.cardVariant["bg-BG"] ?? fields.cardVariant;
			collectionEntry.setLocale("en-CA").setFieldValue("cardVariant", val);
		}
		if (fields.variant) {
			const val = fields.variant["en-CA"] ?? fields.variant["bg-BG"] ?? fields.variant;
			collectionEntry.setLocale("en-CA").setFieldValue("variant", val);
		}
		if (fields.itemsPerRow) {
			const val = fields.itemsPerRow["en-CA"] ?? fields.itemsPerRow["bg-BG"] ?? fields.itemsPerRow;
			collectionEntry.setLocale("en-CA").setFieldValue("itemsPerRow", val);
		}

		if (fields.cards && Array.isArray(fields.cards)) {
			const cardEntries = fields.cards
				.map((c) => (c.sys ? createdEntries.get(c.sys.id) : null))
				.filter(Boolean);
			if (cardEntries.length > 0) {
				collectionEntry.setLocale("en-CA").setFieldValue("cards", cardEntries);
			}
		}

		migration.publishEntry(sys.id);
	});

	console.log(`\n✨ Import complete! ${allHeadings.length} headings, ${cards.length} cards, ${collections.length} collections.`);
};
