/**
 * Page `iconName`: optional Lucide icon shown next to the page's link in the
 * header menu (e.g. "CalendarDays" on Events). The link mapping already reads
 * `iconName` from page entries (utils/linkHelpers.ts → contentfulItemToLink).
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const page = migration.editContentType("page");
  page.createField("iconName").name("Menu Icon").type("Symbol").required(false);
  page.changeFieldControl("iconName", "builtin", "singleLine", {
    helpText: "Optional Lucide icon name shown in the header menu, e.g. CalendarDays (see lucide.dev/icons).",
  });
  page.moveField("iconName").afterField("highlightInMenu");
};
