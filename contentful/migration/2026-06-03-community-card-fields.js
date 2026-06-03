/**
 * Phase 2 (2/3) — Add `city` + `category` to the `card` type.
 *
 * Field-adds on an existing type (do NOT count against the content-type quota),
 * so an org is added in ONE step: create a card, set city + category, publish —
 * the directory queries by city automatically.
 *
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-card-fields.js
 */
module.exports = (migration) => {
  const card = migration.editContentType("card");

  card.createField("city").name("City").type("Symbol").required(false);
  card
    .createField("category")
    .name("Category")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([{ linkContentType: ["communityCategory"] }]);

  card.changeFieldControl("city", "builtin", "singleLine", {
    helpText: "Lowercase city slug, e.g. 'montreal'. Drives which city directory this org appears in.",
  });
  card.changeFieldControl("category", "builtin", "entryLinkEditor", {
    helpText: "The directory category this org belongs to.",
  });
};
