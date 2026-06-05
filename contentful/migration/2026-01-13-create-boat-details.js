module.exports = (migration) => {
	const boat = migration
		.createContentType("boat")
		.name("Boat")
		.description("Boat listing with details for search and booking")
		.displayField("title")

	boat
		.createField("title")
		.name("Title")
		.type("Symbol")
		.localized(true)
		.required(true)

	boat
		.createField("slug")
		.name("Slug")
		.type("Symbol")
		.required(true)
		.validations([
			{
				unique: true,
			},
		])

	boat
		.createField("description")
		.name("Description")
		.type("Text")
		.localized(true)
		.required(true)

	boat
		.createField("shortDescription")
		.name("Short Description")
		.type("Symbol")
		.localized(true)
		.required(true)

	boat
		.createField("image")
		.name("Image")
		.type("Link")
		.linkType("Asset")
		.required(true)

	boat
		.createField("price")
		.name("Price Per Day")
		.type("Integer")
		.validations([
			{
				range: {
					min: 0,
				},
			},
		])
		.required(true)

	boat
		.createField("currency")
		.name("Currency")
		.type("Symbol")
		.defaultValue({
			"en-CA": "USD",
		})
		.validations([
			{
				in: ["USD", "EUR", "GBP", "CAD", "AUD"],
			},
		])

	boat
		.createField("rating")
		.name("Rating")
		.type("Number")
		.validations([
			{
				range: {
					min: 0,
					max: 5,
				},
			},
		])

	boat
		.createField("reviewCount")
		.name("Review Count")
		.type("Integer")
		.defaultValue({
			"en-CA": 0,
		})

	boat
		.createField("location")
		.name("Location")
		.type("Symbol")
		.localized(true)
		.required(true)

	boat.createField("specifications").name("Specifications").type("Object")

	boat.createField("amenities").name("Amenities").type("Array").items({
		type: "Symbol",
	})

	boat.createField("availability").name("Availability").type("Object")

	boat.createField("owner").name("Owner/Company").type("Symbol").localized(true)

	boat
		.createField("contactEmail")
		.name("Contact Email")
		.type("Symbol")
		.validations([
			{
				regexp: {
					pattern: "^[^@]+@[^@]+\\.[^@]+$",
					flags: null,
				},
				message: "Must be a valid email",
			},
		])

	boat
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
	boat.changeFieldControl("title", "builtin", "singleLine", {})
	boat.changeFieldControl("slug", "builtin", "singleLine", {
		helpText: "URL-friendly identifier for the boat",
	})
	boat.changeFieldControl("description", "builtin", "multipleLine", {
		helpText: "Detailed description shown on boat details page",
	})
	boat.changeFieldControl("shortDescription", "builtin", "singleLine", {
		helpText: "Short summary shown in search results",
	})
	boat.changeFieldControl("image", "builtin", "assetLinkEditor", {})
	boat.changeFieldControl("price", "builtin", "numberEditor", {
		helpText: "Daily rental price",
	})
	boat.changeFieldControl("currency", "builtin", "dropdown", {})
	boat.changeFieldControl("rating", "builtin", "numberEditor", {
		helpText: "Star rating (0-5)",
	})
	boat.changeFieldControl("reviewCount", "builtin", "numberEditor", {})
	boat.changeFieldControl("location", "builtin", "singleLine", {})
	boat.changeFieldControl("specifications", "builtin", "objectEditor", {
		helpText:
			'Example: {"length": "45 ft", "maxPassengers": 12, "cabins": 4, "boatType": "Yacht"}',
	})
	boat.changeFieldControl("amenities", "builtin", "checkbox", {
		helpText: "List of amenities available on this boat",
	})
	boat.changeFieldControl("availability", "builtin", "objectEditor", {
		helpText:
			'Example: {"available": true, "minDays": 3, "bookingWindow": "2 weeks"}',
	})
	boat.changeFieldControl("owner", "builtin", "singleLine", {})
	boat.changeFieldControl("contactEmail", "builtin", "singleLine", {})
	boat.changeFieldControl("metaData", "builtin", "entryLinkEditor", {})
}

// contentful space migration --environment-id 'master' --space-id 81ywru7oa6uh contentful/migration/2026-01-13-create-boat-details.js
