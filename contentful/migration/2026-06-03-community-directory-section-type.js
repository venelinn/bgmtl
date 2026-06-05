/**
 * Phase 2 (extra) — `communityDirectory` SECTION type.
 *
 * Now that 2 content-type slots were freed (table/tableRow removed), the
 * directory can be a real CMS section: drop one of these on a page's `sections`
 * and componentMap renders it (DirectoryConnector queries cards by `city`).
 *
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-section-type.js
 */
module.exports = (migration) => {
  const directory = migration
    .createContentType("communityDirectory")
    .name("Community Directory")
    .description("Filterable directory section. Shows every card whose `city` matches, grouped by category.")
    .displayField("title");

  directory.createField("title").name("Title (internal)").type("Symbol").required(true);
  directory.createField("city").name("City").type("Symbol").required(true);
  directory
    .createField("heading")
    .name("Heading")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([{ linkContentType: ["heading"] }]);
  directory.createField("intro").name("Intro").type("Symbol").localized(true).required(false);
  directory.createField("itemsPerRow").name("Cards Per Row").type("Integer").required(false);
  directory.createField("autocomplete").name("Search Autocomplete").type("Boolean").required(false);

  directory.changeFieldControl("title", "builtin", "singleLine", {
    helpText: "Editor-only label, e.g. 'Montreal Directory'.",
  });
  directory.changeFieldControl("city", "builtin", "singleLine", {
    helpText: "Lowercase city slug to show, e.g. 'montreal'. Must match the `city` set on the cards.",
  });
  directory.changeFieldControl("displayTitle", "builtin", "singleLine", {
    helpText: "Visible heading above the directory.",
  });
  directory.changeFieldControl("itemsPerRow", "builtin", "numberEditor", { helpText: "1–4. Defaults to 2." });
  directory.changeFieldControl("autocomplete", "builtin", "boolean", {
    helpText: "Show the search suggestions dropdown. Defaults to on.",
  });
};
