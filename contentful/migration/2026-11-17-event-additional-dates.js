/**
 * Events on several dates (e.g. the monthly Bulgarian bazaar): one event entry
 * with its main Date plus a list of extra days. Each extra day becomes its own
 * occurrence with the main date's time and doors-open time (utils/eventSeries.ts);
 * lists show the series as one card with "+N дати".
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const event = migration.editContentType("event");

  event
    .createField("additionalDates")
    .name("Additional dates")
    .type("Array")
    .items({
      type: "Symbol",
      validations: [{ regexp: { pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, message: "Use YYYY-MM-DD, e.g. 2027-01-31" }],
    })
    .localized(false)
    .required(false);

  event.changeFieldControl("additionalDates", "builtin", "tagEditor", {
    helpText:
      "Other days of the same event (YYYY-MM-DD, e.g. 2027-01-31). Same time, place and text as the main Date. A date with a different time or place: make a separate event with the same Bulgarian heading.",
  });
  event.moveField("additionalDates").afterField("date");
};
