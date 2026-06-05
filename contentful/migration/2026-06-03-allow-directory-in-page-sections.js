/**
 * Allow `communityDirectory` entries in a page's `sections` field.
 *
 * page.sections was restricted to ["section", "hero"]; the directory is a
 * top-level section too, so add it to the allowed link types.
 *
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-allow-directory-in-page-sections.js
 */
module.exports = (migration) => {
  migration
    .editContentType("page")
    .editField("sections")
    .items({
      type: "Link",
      linkType: "Entry",
      validations: [{ linkContentType: ["section", "hero", "communityDirectory"] }],
    });
};
