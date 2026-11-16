/**
 * Event `tags`: up to 2 fixed values shown as pills on the event card. A Symbol
 * list (labels translated in messages/*.json under Events.tags) rather than a
 * reference to a new content type — the space is at 24/25 types.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const event = migration.editContentType("event");

  event
    .createField("tags")
    .name("Tags")
    .type("Array")
    .items({
      type: "Symbol",
      validations: [
        { in: ["theatre", "music", "family", "traditions", "culture", "sport", "community", "guest", "free"] },
      ],
    })
    .validations([{ size: { max: 2 } }])
    .required(false);

  event.changeFieldControl("tags", "builtin", "checkbox", {
    helpText:
      "Up to 2. Shown as pills above the title. theatre = Театър и комедия, music = Музика и парти, family = Семейно, traditions = Традиции, culture = Култура и изкуство, sport = Спорт, community = Среща на общността, guest = Гостуване, free = Безплатен вход.",
  });
  event.moveField("tags").afterField("venue");
};
