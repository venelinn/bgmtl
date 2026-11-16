/**
 * Extended hero (homepage): directory search, quick category chips and CTA
 * buttons, all driven from the Hero entry. Fields on `hero` rather than a new
 * content type — the space is at 24/25 types.
 *
 * Also exposes the existing `two-thirds` Section height in the `height` field.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const hero = migration.editContentType("hero");

  hero.editField("height").validations([{ in: ["full", "two-thirds", "half", "quarter"] }]);

  hero.createField("extended").name("Extended (search + quick links)").type("Boolean").required(false);
  hero.createField("searchPlaceholder").name("Search Placeholder").type("Symbol").localized(true).required(false);
  hero.createField("searchButtonLabel").name("Search Button Label").type("Symbol").localized(true).required(false);
  hero.createField("quickLinksLabel").name("Quick Links Label").type("Symbol").localized(true).required(false);
  hero
    .createField("quickCategories")
    .name("Quick Categories")
    .type("Array")
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["communityCategory"] }] })
    .validations([{ size: { max: 6 } }])
    .required(false);
  hero
    .createField("buttons")
    .name("Buttons")
    .type("Array")
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["link"] }] })
    .validations([{ size: { max: 2 } }])
    .required(false);

  hero.changeFieldControl("extended", "builtin", "boolean", {
    helpText: "Shows the directory search, quick category chips and buttons under the content. Off for event/news heroes.",
    trueLabel: "Yes",
    falseLabel: "No",
  });
  hero.changeFieldControl("searchPlaceholder", "builtin", "singleLine", {
    helpText: "Extended only. Search submits to the community directory. Defaults to the site translation.",
  });
  hero.changeFieldControl("searchButtonLabel", "builtin", "singleLine", {
    helpText: "Extended only. Defaults to the site translation.",
  });
  hero.changeFieldControl("quickLinksLabel", "builtin", "singleLine", {
    helpText: "Extended only. Label before the category chips, e.g. 'Бърз избор:'.",
  });
  hero.changeFieldControl("quickCategories", "builtin", "entryLinksEditor", {
    helpText: "Extended only. Up to 6 directory categories shown as chips, in this order. Empty = first 5 categories.",
  });
  hero.changeFieldControl("buttons", "builtin", "entryLinksEditor", {
    helpText: "Extended only. Up to 2 Link entries shown as buttons under the search (use Link type 'button').",
  });

  hero.moveField("extended").afterField("size");
  hero.moveField("searchPlaceholder").afterField("extended");
  hero.moveField("searchButtonLabel").afterField("searchPlaceholder");
  hero.moveField("quickLinksLabel").afterField("searchButtonLabel");
  hero.moveField("quickCategories").afterField("quickLinksLabel");
  hero.moveField("buttons").afterField("quickCategories");
};
