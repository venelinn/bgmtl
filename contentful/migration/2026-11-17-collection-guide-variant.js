/**
 * Add the "guide" card variant to Collection, for the newcomer guide (/help):
 * icon + topic + title + text + link to the official source, rendered by
 * GuideCard. Reuses the Card type (role = topic label), so no new type.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const collection = migration.editContentType("collection");

  collection.editField("cardVariant").validations([{ in: ["info", "event", "member", "primary", "guide"] }]);
};
