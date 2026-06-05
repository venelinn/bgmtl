/**
 * Phase 2 (1/3) — Community directory TAXONOMY types.
 *
 * Creates the two browse types used by the city directory:
 *   - communityGroup     : top-level browse tier (Community, Faith, Services…)
 *   - communityCategory  : a category (Associations, Plumbers…) → one group
 *
 * NOTE: a `communityDirectory` *section* type was intentionally dropped — the
 * space is at its content-type quota (25). The Montreal directory renders from a
 * dedicated route (app/[lang]/bg-community-montreal) instead, so no section type
 * is needed. The `card` field-adds (city, category) live in the separate
 * `...-card-fields.js` migration (field-adds don't count against the quota).
 *
 * Run order:
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-model.js
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-card-fields.js
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-seed.js
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-backfill.js
 */
module.exports = (migration) => {
  // --- communityGroup -------------------------------------------------------
  const group = migration
    .createContentType("communityGroup")
    .name("Community Group")
    .description("Top-level browse tier for the community directory (Community, Faith, Services, …).")
    .displayField("label");

  group.createField("label").name("Label").type("Symbol").localized(true).required(true);
  group
    .createField("slug")
    .name("Slug")
    .type("Symbol")
    .required(true)
    .validations([{ unique: true }]);
  group.createField("order").name("Order").type("Integer").required(false);

  group.changeFieldControl("slug", "builtin", "slugEditor", {
    helpText: "Stable lowercase id, e.g. 'services'. Do NOT translate.",
  });
  group.changeFieldControl("order", "builtin", "numberEditor", { helpText: "Lower numbers show first." });

  // --- communityCategory ----------------------------------------------------
  const category = migration
    .createContentType("communityCategory")
    .name("Community Category")
    .description("A directory category (Associations, Churches, Plumbers, …). Belongs to one group.")
    .displayField("label");

  category.createField("label").name("Label").type("Symbol").localized(true).required(true);
  category
    .createField("slug")
    .name("Slug")
    .type("Symbol")
    .required(true)
    .validations([{ unique: true }]);
  category.createField("order").name("Order").type("Integer").required(false);
  category
    .createField("group")
    .name("Group")
    .type("Link")
    .linkType("Entry")
    .required(false)
    .validations([{ linkContentType: ["communityGroup"] }]);

  category.changeFieldControl("slug", "builtin", "slugEditor", {
    helpText: "Stable lowercase id a card's `category` matches, e.g. 'plumber'. Do NOT translate.",
  });
  category.changeFieldControl("order", "builtin", "numberEditor", { helpText: "Lower numbers show first." });
};
