module.exports = (migration) => {
	const boatDetailsConfig = migration
		.createContentType("boatDetailsPageConfiguration")
		.name("Details Page Configuration")
		.description("Configuration for boat details page layout and components")
		.displayField("title")

	boatDetailsConfig
		.createField("title")
		.name("Title")
		.type("Symbol")
		.localized(true)
		.required(true)

	boatDetailsConfig
		.createField("slug")
		.name("Slug")
		.type("Symbol")
		.required(true)
		.validations([
			{
				unique: true,
			},
		])

	boatDetailsConfig
		.createField("description")
		.name("Description")
		.type("Text")
		.localized(true)
		.required(false)

	// Layout variant
	boatDetailsConfig
		.createField("layoutVariant")
		.name("Layout Variant")
		.type("Symbol")
		.required(true)
		.validations([
			{
				in: ["hero-sidebar", "hero-full", "gallery-sidebar", "minimal"],
			},
		])
		.defaultValue({
			"en-CA": "hero-sidebar",
		})

	// Enabled sections (which components to display)
	boatDetailsConfig
		.createField("enabledSections")
		.name("Enabled Sections")
		.type("Array")
		.items({
			type: "Symbol",
			validations: [
				{
					in: [
						"specifications",
						"amenities",
						"availability",
						"reviews",
						"bookingCard",
						"ownerInfo",
						"gallery",
						"locationMap",
						"relatedBoats",
					],
				},
			],
		})
		.required(true)
		.defaultValue({
			"en-CA": [
				"specifications",
				"amenities",
				"availability",
				"bookingCard",
				"ownerInfo",
			],
		})

	// CTA Button settings
	boatDetailsConfig
		.createField("ctaButtonLabel")
		.name("CTA Button Label")
		.type("Symbol")
		.localized(true)
		.required(true)
		.defaultValue({
			"en-CA": "Contact Owner",
		})

	boatDetailsConfig
		.createField("ctaButtonAction")
		.name("CTA Button Action")
		.type("Symbol")
		.required(true)
		.validations([
			{
				in: ["email", "phone", "whatsapp", "booking"],
			},
		])
		.defaultValue({
			"en-CA": "booking",
		})

	// Gallery settings
	boatDetailsConfig
		.createField("galleryDisplayMode")
		.name("Gallery Display Mode")
		.type("Symbol")
		.required(false)
		.validations([
			{
				in: ["carousel", "grid", "lightbox", "hero-only"],
			},
		])
		.defaultValue({
			"en-CA": "hero-only",
		})

	// Specs grid columns
	boatDetailsConfig
		.createField("specsGridColumns")
		.name("Specs Grid Columns")
		.type("Integer")
		.required(false)
		.validations([
			{
				range: {
					min: 2,
					max: 6,
				},
			},
		])
		.defaultValue({
			"en-CA": 3,
		})

	// Show booking sidebar
	boatDetailsConfig
		.createField("showBookingSidebar")
		.name("Show Booking Sidebar")
		.type("Boolean")
		.required(true)
		.defaultValue({
			"en-CA": true,
		})

	// Hide price
	boatDetailsConfig
		.createField("hidePrice")
		.name("Hide Price")
		.type("Boolean")
		.required(false)
		.defaultValue({
			"en-CA": false,
		})

	// Section labels (JSON)
	boatDetailsConfig
		.createField("sectionLabels")
		.name("Section Labels")
		.type("Object")
		.required(false)

	boatDetailsConfig
		.createField("metaData")
		.name("Meta Data")
		.type("Link")
		.linkType("Entry")
		.validations([
			{
				linkContentType: ["metaData"],
			},
		])

	// Set field controls
	boatDetailsConfig.changeFieldControl("title", "builtin", "singleLine", {})
	boatDetailsConfig.changeFieldControl("slug", "builtin", "singleLine", {
		helpText: "URL-friendly identifier (use 'boat-details' for main config)",
	})
	boatDetailsConfig.changeFieldControl(
		"description",
		"builtin",
		"multipleLine",
		{
			helpText: "Description of this configuration setup",
		},
	)
	boatDetailsConfig.changeFieldControl("layoutVariant", "builtin", "dropdown", {
		helpText: "Choose how boat details page layout is structured",
	})
	boatDetailsConfig.changeFieldControl(
		"enabledSections",
		"builtin",
		"tagEditor",
		{
			helpText: "Select which sections to display on boat details page",
		},
	)
	boatDetailsConfig.changeFieldControl(
		"ctaButtonLabel",
		"builtin",
		"singleLine",
		{
			helpText: "Text displayed on the main CTA button",
		},
	)
	boatDetailsConfig.changeFieldControl(
		"ctaButtonAction",
		"builtin",
		"dropdown",
		{
			helpText: "Action triggered when CTA button is clicked",
		},
	)
	boatDetailsConfig.changeFieldControl(
		"galleryDisplayMode",
		"builtin",
		"dropdown",
		{
			helpText: "How boat images are displayed",
		},
	)
	boatDetailsConfig.changeFieldControl(
		"specsGridColumns",
		"builtin",
		"numberEditor",
		{
			helpText: "Number of columns for specifications grid (2-6)",
		},
	)
	boatDetailsConfig.changeFieldControl(
		"showBookingSidebar",
		"builtin",
		"boolean",
		{
			helpText: "Toggle booking sidebar visibility",
		},
	)
	boatDetailsConfig.changeFieldControl("hidePrice", "builtin", "boolean", {
		helpText: "Hide price information from display",
	})
	boatDetailsConfig.changeFieldControl(
		"sectionLabels",
		"builtin",
		"objectEditor",
		{
			helpText:
				'Example: {"specifications": "Boat Specs", "amenities": "What\'s Included"}',
		},
	)
	boatDetailsConfig.changeFieldControl(
		"metaData",
		"builtin",
		"entryLinkEditor",
		{},
	)
}

// contentful space migration --environment-id 'master' --space-id 81ywru7oa6uh contentful/migration/2026-01-13-create-boat-details-config.js
