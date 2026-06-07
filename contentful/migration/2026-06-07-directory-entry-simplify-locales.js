/**
 * Simplify `directoryEntry`: website + address are the same in any language, so
 * make them NON-localized. Safe — the space default locale is bg-BG, which is
 * where the values were written, so the data is kept.
 *
 *   pnpm run contentful:migrate -- contentful/migration/2026-06-07-directory-entry-simplify-locales.js
 */
module.exports = (migration) => {
  const entry = migration.editContentType("directoryEntry");
  entry.editField("website").localized(false);
  entry.editField("address").localized(false);
};
