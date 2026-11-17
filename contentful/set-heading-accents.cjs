/**
 * Split page-header headings into heading + accent (red italic tail, like
 * "Свържете се *с нас*"). Needs migration 2026-11-17-heading-accent.js first.
 *
 * Id-targeted: only the heading entries below are touched; other fields stay
 * as they are. The help page heading lives in add-help-guide.cjs.
 *
 *   node contentful/set-heading-accents.cjs            # dry run
 *   node contentful/set-heading-accents.cjs --publish  # update and publish
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");

// entry id → { locale: [heading, accent] }
const HEADINGS = {
  // /community
  "5jkjlplwL0X27Ymg73qbdC": {
    "bg-BG": ["Българска общност", "в Монреал"],
    "en-CA": ["Bulgarian community", "in Montréal"],
    "fr-CA": ["Communauté bulgare", "à Montréal"],
  },
  // /privacy
  "67zbyzRj4FpraMJXuGWHdh": {
    "bg-BG": ["Политика за", "поверителност"],
    "en-CA": ["Privacy", "policy"],
    "fr-CA": ["Politique de", "confidentialité"],
  },
  // /mission
  "6NqWTby7yixXzGW1rwnoP": {
    "bg-BG": ["Нашата", "мисия"],
    "en-CA": ["Our", "mission"],
    "fr-CA": ["Notre", "mission"],
  },
  // /history
  YPFeK9epUcgkmfBbMN2xE: {
    "bg-BG": ["Нашата", "история"],
    "en-CA": ["Our", "history"],
    "fr-CA": ["Notre", "histoire"],
  },
  // /sponsors
  "42aWHx2azqAfFSJCGAuHU": {
    "bg-BG": ["Нашите", "спонсори"],
    "en-CA": ["Our", "sponsors"],
    "fr-CA": ["Nos", "commanditaires"],
  },
  // /about-policies
  "2BUKvaGAWXARW5JUjP3fKu": {
    "bg-BG": ["Нашите", "политики"],
    "en-CA": ["Our", "policies"],
    "fr-CA": ["Nos", "politiques"],
  },
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

  for (const [entryId, locales] of Object.entries(HEADINGS)) {
    const entry = await client.entry.get({ entryId });
    const before = JSON.stringify(entry.fields.heading);
    entry.fields.heading = { ...entry.fields.heading };
    entry.fields.accent = { ...(entry.fields.accent || {}) };
    for (const [locale, [heading, accent]] of Object.entries(locales)) {
      entry.fields.heading[locale] = heading;
      entry.fields.accent[locale] = accent;
    }
    console.log(`${entryId}\n  was ${before}`);
    for (const [locale, [heading, accent]] of Object.entries(locales)) console.log(`  [${locale}] ${heading} *${accent}*`);

    if (!PUBLISH) continue;
    const updated = await client.entry.update({ entryId }, entry);
    await client.entry.publish({ entryId }, updated);
    console.log("  ✓ published");
  }
  if (!PUBLISH) console.log("\nDry run. Re-run with --publish to update and publish.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
