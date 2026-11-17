/**
 * Bulgarian bazaar, season 2026/2027: one event "Български базар" on its first
 * date plus the rest as `additionalDates` (same time 9:00–13:00, same place).
 * Dates from the organizers (Mariela Mihova). Not all are the last Sunday of
 * the month (20 Dec 2026 and 13 Jun 2027 are earlier), so the text names the
 * dates instead of a rule, and never a single date, because every date shares it.
 *
 * The 14 June 2026 entry keeps its own text (true for that day) and loses the
 * additionalDates an earlier script put on it.
 *
 * Needs migration 2026-11-17-event-additional-dates.js.
 *
 *   node contentful/add-bazaar-season.cjs            # dry run
 *   node contentful/add-bazaar-season.cjs --publish  # apply
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const OLD_ID = "event-bulgarian-bazaar-every-last-sunday-of-th-2026-06-14";
const EVENT_ID = "event-bulgarian-bazaar-2026-27";
const HEADING_ID = "heading-event-bulgarian-bazaar-2026-27";
const LOCALES = ["bg-BG", "en-CA", "fr-CA"];

const FIRST = "2026-11-29T09:00:00";
const MORE = ["2026-12-20", "2027-01-31", "2027-02-28", "2027-03-28", "2027-04-25", "2027-05-30", "2027-06-13"];

const tri = (bg, en, fr) => ({ "bg-BG": bg, "en-CA": en, "fr-CA": fr });
const text = (value) => ({ nodeType: "text", value, marks: [], data: {} });
const doc = (paragraphs) => ({
  nodeType: "document",
  data: {},
  content: paragraphs.map((value) => ({ nodeType: "paragraph", data: {}, content: [text(value)] })),
});

const HEADING = tri("Български базар", "Bulgarian Bazaar", "Marché bulgare");
const EXCERPT = tri(
  "Каним всички, които желаят да се докоснат за 4 часа до България! Веднъж в месеца, в неделя, от 9:00 до 13:00 ч. в Българската православна църква.",
  "Everyone who wants a taste of Bulgaria for 4 hours is welcome! Once a month, on a Sunday, 9:00 a.m. to 1:00 p.m. at the Bulgarian Orthodox Church.",
  "Venez découvrir la Bulgarie le temps de quatre heures ! Une fois par mois, le dimanche, de 9 h à 13 h, à l’Église orthodoxe bulgare.",
);
const CONTENT = {
  "bg-BG": [
    "Здравейте, уважаеми производители, посетители и симпатизанти на Българските базари!",
    "Каним всички, които желаят да се докоснат за 4 часа до България!",
    "Кога: веднъж в месеца, в неделя, от 9:00 до 13:00 ч.",
    "Датите за сезон 2026/2027: 29 ноември, 20 декември, 31 януари, 28 февруари, 28 март, 25 април, 30 май и 13 юни.",
    "Къде: Българска православна църква, 1191 Rue Sauvé E, Montréal, QC H2C 1Z8",
    "Желаещите да участват могат да се запишат (да запазят маса) на тел. 514-677-4241 след 19 ч. всяка вечер.",
  ],
  "en-CA": [
    "Hello, dear vendors, visitors and supporters of the Bulgarian Bazaars!",
    "Everyone who wants a taste of Bulgaria for 4 hours is welcome!",
    "When: once a month, on a Sunday, 9:00 a.m. to 1:00 p.m.",
    "Dates for the 2026/2027 season: November 29, December 20, January 31, February 28, March 28, April 25, May 30 and June 13.",
    "Where: Bulgarian Orthodox Church, 1191 Rue Sauvé E, Montréal, QC H2C 1Z8",
    "Vendors can register (reserve a table) by calling 514-677-4241 after 7:00 p.m. any evening.",
  ],
  "fr-CA": [
    "Bonjour à tous, chers exposants, visiteurs et sympathisants des Bazars bulgares !",
    "Venez découvrir la Bulgarie le temps de quatre heures !",
    "Quand : une fois par mois, le dimanche, de 9 h à 13 h.",
    "Dates de la saison 2026-2027 : 29 novembre, 20 décembre, 31 janvier, 28 février, 28 mars, 25 avril, 30 mai et 13 juin.",
    "Où : Église orthodoxe bulgare, 1191, rue Sauvé E, Montréal, QC H2C 1Z8",
    "Les exposants peuvent s’inscrire (réserver une table) au 514-677-4241 après 19 h, tous les soirs.",
  ],
};

async function upsert(client, id, contentTypeId, fields) {
  let entry;
  try {
    entry = await client.entry.get({ entryId: id });
    entry.fields = { ...entry.fields, ...fields };
    entry = await client.entry.update({ entryId: id }, entry);
  } catch (err) {
    if (!/NotFound|could not be found/i.test(err.message)) throw err;
    entry = await client.entry.createWithId({ entryId: id, contentTypeId }, { fields });
  }
  await client.entry.publish({ entryId: id }, entry);
  console.log(`✓ ${contentTypeId} ${id}`);
}

async function main() {
  for (const loc of LOCALES) {
    console.log(`\n[${loc}] ${HEADING[loc]}\n  ${EXCERPT[loc]}\n  ${CONTENT[loc].join("\n  ")}`);
  }
  console.log(`\n${EVENT_ID}: ${FIRST} + ${MORE.join(", ")}`);
  console.log(`${OLD_ID}: remove additionalDates`);
  if (!PUBLISH) {
    console.log("\nDry run. Re-run with --publish to apply.");
    return;
  }

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

  // The 14 June entry: back to a single date; venue, cover and hero size are copied to the new entry.
  const old = await client.entry.get({ entryId: OLD_ID });
  const { venue, cover, heroHeight } = old.fields;
  if (old.fields.additionalDates) {
    delete old.fields.additionalDates;
    const updated = await client.entry.update({ entryId: OLD_ID }, old);
    await client.entry.publish({ entryId: OLD_ID }, updated);
    console.log(`✓ event ${OLD_ID} (single date again)`);
  }

  await upsert(client, HEADING_ID, "heading", {
    title: { "bg-BG": "Event: Bulgarian Bazaar 2026/27" },
    heading: HEADING,
    as: { "bg-BG": "h2" },
    size: { "bg-BG": "h2" },
  });
  await upsert(client, EVENT_ID, "event", {
    title: { "bg-BG": "Event: Bulgarian Bazaar 2026/27" },
    heading: { "bg-BG": { sys: { type: "Link", linkType: "Entry", id: HEADING_ID } } },
    date: { "bg-BG": FIRST },
    doorsOpen: { "bg-BG": FIRST },
    additionalDates: { "bg-BG": MORE },
    ...(venue && { venue }),
    ...(cover && { cover }),
    ...(heroHeight && { heroHeight }),
    excerpt: Object.fromEntries(LOCALES.map((loc) => [loc, doc([EXCERPT[loc]])])),
    content: Object.fromEntries(LOCALES.map((loc) => [loc, doc(CONTENT[loc])])),
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
