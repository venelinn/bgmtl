/**
 * Give pages their own `pageName` heading. On these pages pageName pointed at
 * the same heading entry as the page title; set-heading-accents.cjs split that
 * title into heading + accent, which cut the nav/breadcrumb label short
 * ("Нашата"). Each page now gets `pagename-<slug>` with its menu label.
 *
 * Live pages are re-published; draft pages are only updated (stay drafts).
 *
 *   node contentful/fix-page-names.cjs            # dry run
 *   node contentful/fix-page-names.cjs --publish  # apply
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const link = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });

const NAMES = {
  mission: { "bg-BG": "Мисия", "en-CA": "Mission", "fr-CA": "Mission" },
  privacy: { "bg-BG": "Политика за поверителност", "en-CA": "Privacy policy", "fr-CA": "Politique de confidentialité" },
  "about-policies": { "bg-BG": "Политики", "en-CA": "Policies", "fr-CA": "Politiques" },
  history: { "bg-BG": "История", "en-CA": "History", "fr-CA": "Histoire" },
  sponsors: { "bg-BG": "Спонсори", "en-CA": "Sponsors", "fr-CA": "Commanditaires" },
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

  for (const [slug, heading] of Object.entries(NAMES)) {
    const page = (await client.entry.getMany({ query: { content_type: "page", "fields.slug": slug } })).items[0];
    if (!page) continue;
    const live = Boolean(page.sys.publishedVersion) && page.sys.version === page.sys.publishedVersion + 1;
    const headingId = `pagename-${slug}`;
    console.log(`${slug}: ${heading["bg-BG"]} (${live ? "live → publish" : "draft → update only"})`);
    if (!PUBLISH) continue;

    let entry;
    try {
      entry = await client.entry.get({ entryId: headingId });
      entry.fields = { ...entry.fields, heading };
      entry = await client.entry.update({ entryId: headingId }, entry);
    } catch (err) {
      if (!/NotFound|could not be found/i.test(err.message)) throw err;
      entry = await client.entry.createWithId(
        { entryId: headingId, contentTypeId: "heading" },
        { fields: { title: { "bg-BG": `Page name: ${slug}` }, heading } },
      );
    }
    await client.entry.publish({ entryId: headingId }, entry);

    page.fields.pageName = { "bg-BG": link(headingId) };
    const updated = await client.entry.update({ entryId: page.sys.id }, page);
    if (live) await client.entry.publish({ entryId: page.sys.id }, updated);
    console.log("  ✓");
  }
  if (!PUBLISH) console.log("\nDry run. Re-run with --publish.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
