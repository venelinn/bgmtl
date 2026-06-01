module.exports = (migration) => {
	const customLinks = migration
		.createContentType("customLinks")
		.name("Custom Links")
		.description("")
		.displayField("title");
	customLinks.createField("title").name("Title").type("Symbol");
	customLinks
		.createField("text")
		.name("Text")
		.type("Symbol")
		.localized(true)
		.required(true);
	customLinks
		.createField("url")
		.name("URL")
		.type("Symbol")
		.localized(true)
		.required(true);

	customLinks
		.createField("target")
		.name("Target")
		.type("Symbol")
		.validations([
			{
				in: ["_blank", "_self"],
			},
		])
		.defaultValue({
			"en-CA": "_self",
		});

	customLinks
		.createField("location")
		.name("Location")
		.type("Symbol")
		.validations([
			{
				in: ["header", "footer"],
			},
		]);

	customLinks.createField("order").name("Order").type("Integer");
	customLinks.changeFieldControl("title", "builtin", "singleLine", {});
	customLinks.changeFieldControl("text", "builtin", "singleLine", {});
	customLinks.changeFieldControl("url", "builtin", "singleLine", {});
	customLinks.changeFieldControl("target", "builtin", "radio", {});
	customLinks.changeFieldControl("location", "builtin", "radio", {});

	customLinks.changeFieldControl("order", "builtin", "numberEditor", {
		helpText:
			"Enter a number to set the order of items. The lowest number represents the highest priority.",
	});
};

// contentful space migration --environment-id 'nextjs' --space-id cktp0gqtqb5p 2024-06-06-rollout-custom-links.js
