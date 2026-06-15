/**
 * Adds "directory" to the predefined values of the Page "listings" field.
 * Enables the homepage "Community Directory" teaser (latest directoryEntry cards)
 * to be toggled on per page alongside the existing events/news listings.
 *
 * Usage: npm run contentful:migrate -- --file=contentful/migration/2026-06-15-add-directory-to-page-listings.js
 */
module.exports = (migration) => {
  const page = migration.editContentType("page");

  page.editField("listings").items({
    type: "Symbol",
    validations: [{ in: ["events", "news", "directory"] }],
  });
};
