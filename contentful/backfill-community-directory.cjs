/**
 * Backfill + cleanup via the Management SDK (id-targeted, idempotent).
 *
 *  1. Publish the Montreal page (created as a draft by the seed script).
 *  2. Tag the 2 existing Montreal cards with city=montreal + their category.
 *  3. Remove the Montreal collection from the Canada page's sections.
 *
 *   node contentful/backfill-community-directory.cjs
 */
const cm = require("contentful-management");

const DEFAULT_LOCALE = "bg-BG";
const MONTREAL_COLLECTION_ID = "collection-bg-community-montreal";
const linkRef = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });

const CARD_TAGS = [
  { id: "info-zornica", category: "cultural-center" },
  { id: "info-st-ivan-rilsky-montreal", category: "church" },
];

async function main() {
  const client = cm.createClient(
    { accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN },
    {
      type: "plain",
      defaults: {
        spaceId: process.env.CONTENTFUL_SPACE_ID,
        environmentId: process.env.CONTENTFUL_ENVIRONMENT || "master",
      },
    },
  );

  // 1. Publish the Montreal page if it isn't already.
  try {
    const page = await client.entry.get({ entryId: "page-bg-community-montreal" });
    if (!page.sys.publishedVersion) {
      await client.entry.publish({ entryId: "page-bg-community-montreal" }, page);
      console.log("✓ published page-bg-community-montreal");
    } else {
      console.log("• page already published");
    }
  } catch (e) {
    console.log("! page-bg-community-montreal:", e.message);
  }

  // 2. Tag the existing Montreal cards.
  for (const { id, category } of CARD_TAGS) {
    try {
      let card = await client.entry.get({ entryId: id });
      card.fields.city = { [DEFAULT_LOCALE]: "montreal" };
      card.fields.category = { [DEFAULT_LOCALE]: linkRef(`community-category-${category}`) };
      card = await client.entry.update({ entryId: id }, card);
      await client.entry.publish({ entryId: id }, card);
      console.log(`✓ tagged ${id} → montreal / ${category}`);
    } catch (e) {
      console.log(`! ${id}:`, e.message);
    }
  }

  // 3. Remove the Montreal collection from any page's sections.
  const pages = await client.entry.getMany({ query: { content_type: "page", limit: 1000 } });
  for (const page of pages.items) {
    const sectionsField = page.fields.sections || {};
    let changed = false;
    for (const locale of Object.keys(sectionsField)) {
      const arr = sectionsField[locale];
      if (!Array.isArray(arr)) continue;
      const filtered = arr.filter((ref) => ref?.sys?.id !== MONTREAL_COLLECTION_ID);
      if (filtered.length !== arr.length) {
        sectionsField[locale] = filtered;
        changed = true;
      }
    }
    if (changed) {
      const slug = page.fields.slug?.[DEFAULT_LOCALE] || page.fields.slug?.["en-CA"] || page.sys.id;
      const updated = await client.entry.update({ entryId: page.sys.id }, page);
      if (page.sys.publishedVersion) await client.entry.publish({ entryId: page.sys.id }, updated);
      console.log(`✓ removed Montreal collection from page "${slug}"`);
    }
  }

  console.log("\n✨ Done.");
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
