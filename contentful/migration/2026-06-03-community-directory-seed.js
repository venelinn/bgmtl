/**
 * Phase 2 (3/3) — Community directory TAXONOMY entries.
 *
 * Creates the communityGroup + communityCategory entries from
 * mockData/bg-community/community-taxonomy.json. The directory itself renders
 * from a code route (app/[lang]/bg-community-montreal) — no directory/page
 * entry needed (see the model migration note about the content-type quota).
 *
 * Run AFTER the model migration:
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-seed.js
 */
const fs = require("node:fs");
const path = require("node:path");

module.exports = (migration) => {
  const taxonomy = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../mockData/bg-community/community-taxonomy.json"), "utf8"),
  );

  // 1. Groups
  const groupEntries = new Map();
  (taxonomy.groups || []).forEach((g) => {
    const id = `community-group-${g.slug}`;
    const entry = migration.createEntry("communityGroup", { id });
    entry.setLocale("en-CA").setFieldValue("slug", g.slug);
    if (g.order != null) entry.setLocale("en-CA").setFieldValue("order", g.order);
    Object.entries(g.label || {}).forEach(([locale, value]) => {
      entry.setLocale(locale).setFieldValue("label", value);
    });
    migration.publishEntry(id);
    groupEntries.set(g.slug, entry);
  });

  // 2. Categories (each linked to its group)
  (taxonomy.categories || []).forEach((c) => {
    const id = `community-category-${c.slug}`;
    const entry = migration.createEntry("communityCategory", { id });
    entry.setLocale("en-CA").setFieldValue("slug", c.slug);
    if (c.order != null) entry.setLocale("en-CA").setFieldValue("order", c.order);
    Object.entries(c.label || {}).forEach(([locale, value]) => {
      entry.setLocale(locale).setFieldValue("label", value);
    });
    const group = c.groupSlug && groupEntries.get(c.groupSlug);
    if (group) entry.setLocale("en-CA").linkField("group", group);
    migration.publishEntry(id);
  });

  console.log(
    `\n✨ Seeded ${(taxonomy.groups || []).length} groups + ${(taxonomy.categories || []).length} categories.`,
  );
};
