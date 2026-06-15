/**
 * Seeds the community directory ENTRIES via the Management SDK.
 *
 * The `contentful space migration` CLI in this project can't create entries
 * (`migration.createEntry` is unavailable), so entry creation lives here.
 * Idempotent: existing entries (by fixed id) are skipped.
 *
 * Creates: communityCategory (from community-taxonomy.json), the Montreal
 * communityDirectory section, its SEO metaData, and the /bg-community-montreal
 * page that renders it.
 *
 *   node contentful/seed-community-directory.cjs
 *   (reads CONTENTFUL_SPACE_ID / _ENVIRONMENT / _MANAGEMENT_TOKEN from env)
 */
const fs = require("node:fs");
const path = require("node:path");
const cm = require("contentful-management");

const DEFAULT_LOCALE = "bg-BG";
const taxonomy = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../mockData/bg-community/community-taxonomy.json"), "utf8"),
);

const nonLoc = (value) => ({ [DEFAULT_LOCALE]: value });
const linkRef = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });

const displayTitle = {
  "en-CA": "BG Community in Montreal",
  "bg-BG": "Българска общност в Монреал",
  "fr-CA": "Communauté bulgare à Montréal",
};
const intro = {
  "en-CA": "Find Bulgarian associations, churches, schools, services and professionals across Montreal.",
  "bg-BG": "Открийте български асоциации, църкви, училища, услуги и специалисти в Монреал.",
  "fr-CA": "Trouvez des associations, églises, écoles, services et professionnels bulgares à Montréal.",
};
const metaTitle = {
  "en-CA": "Bulgarian Community in Montreal",
  "bg-BG": "Българска общност в Монреал",
  "fr-CA": "Communauté bulgare à Montréal",
};
const metaDescription = {
  "en-CA": "Directory of Bulgarian associations, churches, schools, services and professionals in Montreal.",
  "bg-BG": "Указател на български асоциации, църкви, училища, услуги и специалисти в Монреал.",
  "fr-CA": "Répertoire des associations, églises, écoles, services et professionnels bulgares à Montréal.",
};

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

  const ensure = async (contentTypeId, entryId, fields) => {
    try {
      await client.entry.get({ entryId });
      console.log("• exists, skipping", entryId);
      return;
    } catch {
      /* not found → create */
    }
    const created = await client.entry.createWithId({ contentTypeId, entryId }, { fields });
    await client.entry.publish({ entryId }, created);
    console.log("✓ created + published", entryId);
  };

  // 1. Categories (flat — the single-tier filter dropdown, ordered by `order`)
  for (const c of taxonomy.categories || []) {
    await ensure("communityCategory", `community-category-${c.slug}`, {
      slug: nonLoc(c.slug),
      order: nonLoc(c.order),
      label: c.label,
    });
  }

  // 3. Heading entry for the directory (rendered via the shared Heading component)
  await ensure("heading", "heading-bg-community-montreal", {
    title: nonLoc("BG Community in Montreal"),
    heading: displayTitle,
    as: nonLoc("h2"),
    size: nonLoc("h2"),
  });

  // 4. Montreal directory section
  await ensure("communityDirectory", "community-directory-montreal", {
    title: nonLoc("Montreal Directory"),
    city: nonLoc("montreal"),
    itemsPerRow: nonLoc(2),
    autocomplete: nonLoc(true),
    heading: nonLoc(linkRef("heading-bg-community-montreal")),
    intro,
  });

  // 4. SEO metadata
  await ensure("metaData", "metadata-bg-community-montreal", {
    title: nonLoc("BG Community in Montreal"),
    pageTitle: metaTitle,
    pageDescription: metaDescription,
  });

  // 5. Montreal page → renders the directory section
  await ensure("page", "page-bg-community-montreal", {
    title: nonLoc("BG Community in Montreal"),
    slug: nonLoc("bg-community-montreal"),
    sidebar: nonLoc(false),
    metaData: nonLoc(linkRef("metadata-bg-community-montreal")),
    sections: nonLoc([linkRef("community-directory-montreal")]),
  });

  console.log("\n✨ Done.");
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
