/**
 * NON-DESTRUCTIVE copy: existing directory `card`s → new `directoryEntry`s.
 *
 * Entry creation must go through the Management SDK (the `contentful space
 * migration` CLI can't create entries in this project — see seed/backfill).
 *
 * Every `card` that has `city` set (i.e. an existing directory listing) is
 * COPIED into a `directoryEntry`. The original cards are LEFT IN PLACE — nothing
 * is deleted, so prod can't break if a deploy and this script land out of order.
 * Idempotent: a directoryEntry that already exists (by fixed id) is skipped.
 *
 * Mapping:
 *   card heading→heading (or title)  → name        (localized)
 *   card.city                        → city
 *   card.category (single link)      → categories  (one-element array)
 *   card.content (rich text)         → phone / email / website / address (best-effort)
 *   card.link → url (if present)     → website
 *
 *   node contentful/migrate-directory-entries.cjs
 *   (reads CONTENTFUL_SPACE_ID / _ENVIRONMENT / _MANAGEMENT_TOKEN from env)
 */
require("dotenv").config();
const cm = require("contentful-management");

const DEFAULT_LOCALE = "bg-BG";

const firstValue = (field) =>
  field && typeof field === "object" && !field.sys && !Array.isArray(field) ? Object.values(field)[0] : field;

// Flatten a Contentful rich-text document into newline-separated plain text.
const richTextToText = (doc) => {
  const lines = [];
  const walk = (node) => {
    if (!node) return;
    if (typeof node.value === "string" && node.value.trim()) lines.push(node.value.trim());
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  walk(doc);
  return lines;
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const URL_RE = /https?:\/\/[^\s)]+/;
// Phone within a SINGLE line only (no newline in the class) so it can't bleed
// the trailing digit of a postal code into the next line's number.
const PHONE_RE = /\+?\d[\d ().\-/]{6,}\d/;
const TEL_LINE_RE = /tel|phone|тел|факс|fax/i;

// name is required + localized → must carry a value in EVERY space locale.
const SPACE_LOCALES = ["en-CA", "bg-BG", "fr-CA"];
const fillLocales = (map) => {
  if (!map || typeof map !== "object") return map;
  const fallback = map["en-CA"] ?? map["bg-BG"] ?? Object.values(map)[0];
  const out = { ...map };
  for (const loc of SPACE_LOCALES) if (out[loc] == null) out[loc] = fallback;
  return out;
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

  const cards = await client.entry.getMany({ query: { content_type: "card", limit: 1000 } });
  const directoryCards = cards.items.filter((c) => firstValue(c.fields.city));
  console.log(`Found ${directoryCards.length} card(s) with a city set.`);

  for (const card of directoryCards) {
    const shortId = card.sys.id.replace(/^(info|card)-/, "");
    const newId = `directory-entry-${shortId}`;

    // Skip if it already exists (idempotent / non-destructive on re-run).
    try {
      await client.entry.get({ entryId: newId });
      console.log(`• ${newId} already exists — skipping`);
      continue;
    } catch {
      /* not found → create below */
    }

    // name: resolve the linked heading entry's `heading` map, else the card title.
    let nameMap = card.fields.title;
    const headingLink = firstValue(card.fields.heading);
    if (headingLink?.sys?.id) {
      try {
        const heading = await client.entry.get({ entryId: headingLink.sys.id });
        if (heading.fields.heading) nameMap = heading.fields.heading;
      } catch {
        /* fall back to title */
      }
    }
    if (!nameMap) {
      console.log(`! ${card.sys.id}: no name — skipping`);
      continue;
    }

    const cityVal = firstValue(card.fields.city);
    const categoryLink = firstValue(card.fields.category);

    // Parse contact details out of the (bg-BG) rich-text content — per line, so a
    // phone never spans two lines.
    const lines = richTextToText(firstValue(card.fields.content));
    let website = (lines.find((l) => URL_RE.test(l))?.match(URL_RE) || [])[0];
    const email = (lines.find((l) => EMAIL_RE.test(l))?.match(EMAIL_RE) || [])[0];
    const phoneLine =
      lines.find((l) => TEL_LINE_RE.test(l) && PHONE_RE.test(l)) ||
      lines.find((l) => PHONE_RE.test(l) && !EMAIL_RE.test(l));
    const phone = phoneLine ? (phoneLine.match(PHONE_RE) || [])[0] : undefined;
    const nameText = firstValue(nameMap);
    const addressLine = lines.find(
      (l) =>
        l !== nameText &&
        l !== phoneLine &&
        !EMAIL_RE.test(l) &&
        !URL_RE.test(l) &&
        !TEL_LINE_RE.test(l) &&
        /\d/.test(l) && // an address has a street number / postcode
        l.length > 8,
    );

    // website can also live on a linked `link` entry.
    const linkRef = firstValue(card.fields.link);
    if (!website && linkRef?.sys?.id) {
      try {
        const link = await client.entry.get({ entryId: linkRef.sys.id });
        website = firstValue(link.fields.url);
      } catch {
        /* ignore */
      }
    }

    const fields = {
      name: fillLocales(nameMap),
      city: { [DEFAULT_LOCALE]: cityVal },
      categories: { [DEFAULT_LOCALE]: categoryLink ? [categoryLink] : [] },
    };
    if (phone) fields.phone = { [DEFAULT_LOCALE]: phone.trim() };
    if (email) fields.email = { [DEFAULT_LOCALE]: email };
    if (website) fields.website = { [DEFAULT_LOCALE]: website };
    if (addressLine) fields.address = { [DEFAULT_LOCALE]: addressLine };

    try {
      const created = await client.entry.createWithId({ contentTypeId: "directoryEntry", entryId: newId }, { fields });
      await client.entry.publish({ entryId: newId }, created);
      console.log(
        `✓ ${newId}  name="${firstValue(nameMap)}"  city=${cityVal}` +
          `${phone ? `  ☎ ${phone.trim()}` : ""}${email ? `  ✉ ${email}` : ""}${addressLine ? "  📍" : ""}`,
      );
    } catch (e) {
      console.log(`! ${newId}:`, e.message);
    }
  }

  console.log("\n✨ Done. Originals (cards) left untouched.");
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
