/**
 * Bulgarian bazaar 2026/2027: add the season's dates to the existing bazaar
 * event as `additionalDates` (same time 09:00 and place as its main date).
 * Dates from the organizers (Mariela Mihova). Not every one is the last Sunday
 * of the month: 20 Dec 2026 and 13 Jun 2027 are earlier.
 *
 * Needs migration 2026-11-17-event-additional-dates.js first.
 *
 *   node contentful/add-bazaar-dates.cjs            # dry run
 *   node contentful/add-bazaar-dates.cjs --publish  # update and publish
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const ENTRY_ID = "event-bulgarian-bazaar-every-last-sunday-of-th-2026-06-14";

const DATES = [
  "2026-11-29",
  "2026-12-20",
  "2027-01-31",
  "2027-02-28",
  "2027-03-28",
  "2027-04-25",
  "2027-05-30",
  "2027-06-13",
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

  const entry = await client.entry.get({ entryId: ENTRY_ID });
  const before = entry.fields.additionalDates?.["bg-BG"] ?? [];
  const dates = [...new Set([...before, ...DATES])].sort();
  console.log(`${ENTRY_ID}\n  main date: ${entry.fields.date?.["bg-BG"]}\n  additionalDates: ${dates.join(", ")}`);
  if (!PUBLISH) {
    console.log("\nDry run. Re-run with --publish to update and publish.");
    return;
  }

  entry.fields.additionalDates = { "bg-BG": dates };
  const updated = await client.entry.update({ entryId: ENTRY_ID }, entry);
  await client.entry.publish({ entryId: ENTRY_ID }, updated);
  console.log("  ✓ published");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
