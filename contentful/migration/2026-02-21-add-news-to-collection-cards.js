/**
 * Adds "news" to Collection's cards field linkContentType.
 * Allows embedding news entries in collections.
 *
 * Usage: npm run contentful:migrate -- --file=contentful/migration/2026-02-21-add-news-to-collection-cards.js
 */
module.exports = (migration) => {
  const collection = migration.editContentType("collection");
  const cardsField = collection.editField("cards");
  cardsField.validations([
    {
      linkContentType: ["card", "member", "news"],
    },
  ]);
};
