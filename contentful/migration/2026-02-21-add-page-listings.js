/**
 * Adds "listings" field to Page content type.
 * Accepts predefined values: events, news (multi-select)
 *
 * Usage: npm run contentful:migrate -- --file=contentful/migration/2026-02-21-add-page-listings.js
 */
module.exports = (migration) => {
  const page = migration.editContentType("page");

  page
    .createField("listings")
    .name("Listings")
    .type("Array")
    .items({
      type: "Symbol",
      validations: [{ in: ["events", "news"] }],
    })
    .required(false);

  // Checkbox editor works well with predefined values
  page.changeFieldControl("listings", "builtin", "checkbox", {});
};
