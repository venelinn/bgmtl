/**
 * Sponsorship tiers on /sponsors: a "tier" card variant for Collection
 * (TierCard: icon, name, price in `role`, benefit list, CTA) and a "featured"
 * Card variant that highlights one tier. Fields only, no new types.
 *
 * Run with the direct-binary snippet in docs/community-directory.md.
 */
module.exports = (migration) => {
  const collection = migration.editContentType("collection");
  collection.editField("cardVariant").validations([{ in: ["info", "event", "member", "primary", "guide", "tier"] }]);

  const card = migration.editContentType("card");
  card.editField("variant").validations([{ in: ["default", "evenSplit", "horizontal", "featured"] }]);
};
