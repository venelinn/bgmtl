/**
 * Phase 2 (3/3) — Backfill + Canada-page cleanup. OPTIONAL / automatable.
 *
 * Two edits to EXISTING content, isolated here so a hiccup can't roll back the
 * seed migration:
 *   1. Tag the 2 existing Montreal cards (Zornica, St. Ivan Rilsky) with
 *      `city: montreal` + their category, so they appear in the new directory.
 *   2. Remove the Montreal collection (`collection-bg-community-montreal`) from
 *      whichever page references it (the Canada page) — "rest of Canada".
 *
 * If `transformEntries` misbehaves in your space/version, both edits are ~1
 * minute each in the Contentful UI instead — see the README note. Run last:
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-03-community-directory-backfill.js
 */
const MONTREAL_COLLECTION_ID = "collection-bg-community-montreal";

const linkRef = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });
const firstValue = (field) => (field && typeof field === "object" ? Object.values(field)[0] : field);

module.exports = (migration) => {
  // 1. Tag the existing Montreal cards by matching their (stable) title.
  migration.transformEntries({
    contentType: "card",
    from: ["title"],
    to: ["city", "category"],
    shouldPublish: true,
    transformEntryForLocale: (fromFields) => {
      const title = String(firstValue(fromFields.title) || "");
      if (/zornica/i.test(title)) {
        return { city: "montreal", category: linkRef("community-category-cultural-center") };
      }
      if (/ivan\s*rilsky/i.test(title)) {
        return { city: "montreal", category: linkRef("community-category-church") };
      }
      return undefined; // leave every other card unchanged
    },
  });

  // 2. Drop the Montreal collection from any page's `sections` (the Canada page).
  migration.transformEntries({
    contentType: "page",
    from: ["sections"],
    to: ["sections"],
    shouldPublish: true,
    transformEntryForLocale: (fromFields) => {
      const sections = firstValue(fromFields.sections);
      if (!Array.isArray(sections)) return undefined;
      const filtered = sections.filter((ref) => ref && ref.sys && ref.sys.id !== MONTREAL_COLLECTION_ID);
      if (filtered.length === sections.length) return undefined; // not on this page
      return { sections: filtered };
    },
  });
};
