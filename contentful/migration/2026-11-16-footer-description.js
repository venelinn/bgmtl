/**
 * Footer `description`: short blurb under the logo in the footer's brand column.
 * A field on the existing `footer` type — the space is at 24/25 content types.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const footer = migration.editContentType("footer");

  footer.createField("description").name("Description").type("Text").localized(true).required(false);

  footer.changeFieldControl("description", "builtin", "multipleLine", {
    helpText: "One or two sentences under the logo in the footer.",
  });
  footer.moveField("description").afterField("title");
};
