/**
 * Adds "itemsPerPage" field to Collection content type.
 * Number of items per page for paginated collections. Default 10 when itemsPerRow is set.
 *
 * Usage: npm run contentful:migrate -- --file=contentful/migration/2026-02-21-add-collection-items-per-page.js
 */
module.exports = (migration) => {
  const collection = migration.editContentType("collection");

  collection
    .createField("itemsPerPage")
    .name("Items Per Page")
    .type("Integer")
    .required(false);

  collection.changeFieldControl("itemsPerPage", "builtin", "numberEditor", {
    helpText: "Number of items per page. Default 10 when Items Per Row is set.",
  });
};
