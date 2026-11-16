/**
 * Allow the `contacts` block directly in page.sections (not only inside a
 * section), so the Contacts page can render its full-width header band.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const page = migration.editContentType("page");
  page.editField("sections").items({
    type: "Link",
    linkType: "Entry",
    validations: [{ linkContentType: ["section", "hero", "communityDirectory", "contacts"] }],
  });
};
