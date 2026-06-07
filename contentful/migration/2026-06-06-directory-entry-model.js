/**
 * Community directory — dedicated `directoryEntry` content type.
 *
 * Replaces the old "reuse the generic `card` type" approach (city + single
 * `category` link + contact info buried in rich-text `content`) with a clean,
 * structured type that the icon-based DirectoryCard renders directly, and that
 * supports MULTIPLE category tags per org.
 *
 *   name        Symbol (localized, required)  — display name (rendered via <Heading>)
 *   city        Symbol (required)             — lowercase slug, e.g. 'montreal'
 *   categories  Array<Link communityCategory> — the filterable tags
 *   phone       Symbol                        — raw number; card builds tel:
 *   email       Symbol                        — card builds mailto:
 *   website     Symbol                        — full URL; card builds external link
 *   address     Symbol                        — shown with a map-pin icon
 *
 * QUOTA: the live space has 24 content types (verified), so this 25th type fits
 * without freeing a slot. Nothing here deletes existing directory data — the old
 * `card`s are left untouched; entries are copied separately (non-destructive) by
 * `contentful/migrate-directory-entries.cjs` (the migration CLI can't create
 * entries in this project, so entry work lives in a Management SDK script).
 *
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-06-directory-entry-model.js
 */
module.exports = (migration) => {
  const entry = migration
    .createContentType("directoryEntry")
    .name("Directory Entry")
    .description("A community/address-book listing (org, business, club). Shown in the city directory by `city`.")
    .displayField("name");

  entry.createField("name").name("Name").type("Symbol").localized(true).required(true);

  entry.createField("city").name("City").type("Symbol").required(true);

  entry
    .createField("categories")
    .name("Categories")
    .type("Array")
    .required(false)
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["communityCategory"] }],
    });

  entry.createField("phone").name("Phone").type("Symbol").required(false);
  entry.createField("email").name("Email").type("Symbol").required(false);
  // website + address are the same in any language → not localized (keep it simple).
  entry.createField("website").name("Website").type("Symbol").required(false);
  entry.createField("address").name("Address").type("Symbol").required(false);

  entry.changeFieldControl("city", "builtin", "singleLine", {
    helpText: "Lowercase city slug, e.g. 'montreal'. Drives which city directory this entry appears in.",
  });
  entry.changeFieldControl("categories", "builtin", "entryLinksEditor", {
    helpText: "One or more directory categories (tags) this entry belongs to.",
  });
  entry.changeFieldControl("phone", "builtin", "singleLine", {
    helpText: "Raw phone number — the card turns it into a tap-to-call link.",
  });
  entry.changeFieldControl("email", "builtin", "singleLine", {
    helpText: "Email address — the card turns it into a mailto link.",
  });
  entry.changeFieldControl("website", "builtin", "urlEditor", {
    helpText: "Full URL incl. https:// — shown as an external link in the card footer.",
  });
  entry.changeFieldControl("address", "builtin", "singleLine", {
    helpText: "Street address — shown with a map-pin icon.",
  });
};
