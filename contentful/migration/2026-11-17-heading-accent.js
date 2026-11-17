/**
 * Add an optional accent to Heading: text shown after the heading in the
 * accent colour (red italic), like "Свържете се *с нас*" on Contacts. Used by
 * page headers (PageHeader) — the first h1 section of a CMS page and the
 * community directory. Ignored elsewhere.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const heading = migration.editContentType("heading");

  heading
    .createField("accent")
    .name("Accent")
    .type("Symbol")
    .localized(true)
    .required(false);

  heading.changeFieldControl("accent", "builtin", "singleLine", {
    helpText: "Page headers only: text shown after the heading in red italics (e.g. heading \"Свържете се\", accent \"с нас\").",
  });
  heading.moveField("accent").afterField("heading");
};
