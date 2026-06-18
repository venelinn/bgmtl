/**
 * Adds the Bulgarian-community catalog (docs/catalog.md) as `directoryEntry`
 * entries (Management SDK — the migration CLI can't create entries). Idempotent:
 * an entry that already exists (by fixed id) is skipped. City defaults to montreal.
 *
 * Categories are tagged per entry (`cat`). The 11 new slugs (education, beauty,
 * auto, food, arts, shopping, pets, tailoring, it, driving-school, finance) must
 * already exist as community-category-<slug> entries — seed the taxonomy FIRST
 * (community-taxonomy.json → seed-community-directory.cjs) or the links dangle.
 *
 *   node contentful/add-catalog-listings.cjs
 */
require("dotenv").config();
const cm = require("contentful-management");

const SPACE_LOCALES = ["en-CA", "bg-BG", "fr-CA"];
const DEFAULT_LOCALE = "bg-BG";

const linkRef = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });
const catLink = (slug) => linkRef(`community-category-${slug}`);

// A required+localized field needs a value in every locale; fill gaps.
const loc = (map) => {
  const fallback = map.en ?? map.bg ?? map.fr;
  return { "en-CA": map.en ?? fallback, "bg-BG": map.bg ?? fallback, "fr-CA": map.fr ?? fallback };
};
const nonLoc = (v) => ({ [DEFAULT_LOCALE]: v });
// Same string across locales (for the combined bilingual `note`).
const sameAll = (v) => Object.fromEntries(SPACE_LOCALES.map((l) => [l, v]));
const url = (u) => (u && !/^https?:\/\//.test(u) ? `https://${u}` : u);

const LISTINGS = [
  {
    id: "maria-ianakova",
    name: { bg: "Мария Янакова", en: "Maria Ianakova", fr: "Maria Ianakova" },
    cat: "education",
    phone: "514-518-6343",
  },
  {
    id: "martin-damyanov",
    name: { bg: "Мартин Дамянов", en: "Martin Damyanov", fr: "Martin Damyanov" },
    cat: "it",
    phone: "438-979-3101",
  },
  {
    id: "iva-ivanova-sweets",
    name: { bg: "Ива Иванова — Сладки", en: "Iva Ivanova — Sweets", fr: "Iva Ivanova — Pâtisseries" },
    cat: "food",
    website: "https://www.facebook.com/share/1CPkViWNmq/",
  },
  {
    id: "iva-ivanova-crafts",
    name: { bg: "Ива Иванова — Крафт", en: "Iva Ivanova — Crafts", fr: "Iva Ivanova — Artisanat" },
    cat: "arts",
    website: "https://www.facebook.com/share/1DK5XjuSFx/",
  },
  {
    id: "magic-studio-siana",
    name: { bg: "MAGIC Studio SIANA", en: "MAGIC Studio SIANA", fr: "MAGIC Studio SIANA" },
    cat: "photographer",
    website: "https://www.facebook.com/profile.php?id=100063662451384",
  },
  {
    id: "auto-ecole-prestige",
    name: { bg: "Auto-école Prestige", en: "Auto-école Prestige", fr: "Auto-école Prestige" },
    cat: "driving-school",
    website: "https://ecoledeconduiteprestige.com/",
    note: "Марио / Mario",
  },
  {
    id: "yanka-ivanova",
    name: { bg: "Янка Иванова", en: "Yanka Ivanova", fr: "Yanka Ivanova" },
    cat: "beauty",
  },
  {
    id: "elza-drumoharska",
    name: { bg: "Елза Друмохарска", en: "Elza Drumoharska", fr: "Elza Drumoharska" },
    cat: "pets",
    website: "https://www.facebook.com/profile.php?id=100053486965719",
    note: "PET LOVER Sitter",
  },
  {
    id: "handbags-vogue",
    name: { bg: "Les sacs à main Vogue", en: "Handbags Vogue", fr: "Les sacs à main Vogue" },
    cat: "shopping",
    phone: "514-927-3103",
    website: "https://handbagsvogue.ca",
    note: "Розина и Лина / Rozina & Lina",
  },
  {
    id: "nastya-petkova",
    name: { bg: "Д-р Настя Петкова", en: "Dr. Nastya Petkova", fr: "Dre Nastya Petkova" },
    cat: "doctor",
    website: "https://www.excellencedentaire.com/",
  },
  {
    id: "senka-asenova",
    name: { bg: "Сенка Асенова", en: "Senka Asenova", fr: "Senka Asenova" },
    cat: "arts",
    phone: "514-244-6644",
  },
  {
    id: "garage-bulforce",
    name: { bg: "Garage Bulforce", en: "Garage Bulforce", fr: "Garage Bulforce" },
    cat: "auto",
    address: "925c Av. du Pacifique, Lachine, QC H8S 1B4",
    note: "Иван / Ivan",
  },
  {
    id: "lidi-pronailss",
    name: { bg: "Lidi.pronailss", en: "Lidi.pronailss", fr: "Lidi.pronailss" },
    cat: "beauty",
    website: "https://www.facebook.com/profile.php?id=100086996003490",
    note: "Лидия Проданова / Lidia Prodanova",
  },
  {
    id: "tsd-auto",
    name: { bg: "TSD Auto", en: "TSD Auto", fr: "TSD Auto" },
    cat: "auto",
    address: "688 Bd du Curé-Labelle, Laval, QC H7V 2T9",
    note: "Тихомир / Tihomir",
  },
  {
    id: "snezhana-krasteva",
    name: { bg: "Снежана Кръстева", en: "Snezhana Krasteva", fr: "Snezhana Krasteva" },
    cat: "tailoring",
    phone: "514-560-8056",
  },
  {
    id: "lyubomir-kolev",
    name: { bg: "Любомир Колев", en: "Lyubomir Kolev", fr: "Lyubomir Kolev" },
    cat: "renovation",
    phone: "514-513-5448",
  },
  {
    id: "plamen-dimitrov",
    name: { bg: "Пламен Димитров", en: "Plamen Dimitrov", fr: "Plamen Dimitrov" },
    cat: "finance",
    phone: "514-589-4201",
  },
  {
    id: "daniela-vassileva",
    name: { bg: "Даниела Василева", en: "Daniela Vassileva", fr: "Daniela Vassileva" },
    cat: "education",
    phone: "438-398-4189",
  },
  {
    id: "hristo-roofing",
    name: { bg: "Христо — Покриви", en: "Hristo — Roofing", fr: "Hristo — Toitures" },
    cat: "renovation",
    phone: "514-651-2794",
  },
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

  for (const item of LISTINGS) {
    const entryId = `directory-entry-${item.id}`;
    try {
      await client.entry.get({ entryId });
      console.log(`• ${entryId} exists — skipping`);
      continue;
    } catch {
      /* not found → create */
    }

    const fields = {
      name: loc(item.name),
      city: nonLoc("montreal"),
      categories: nonLoc([catLink(item.cat)]),
    };
    if (item.phone) fields.phone = nonLoc(item.phone);
    if (item.email) fields.email = nonLoc(item.email);
    if (item.website) fields.website = nonLoc(url(item.website));
    if (item.address) fields.address = nonLoc(item.address);
    if (item.note) fields.note = sameAll(item.note);

    try {
      const created = await client.entry.createWithId({ contentTypeId: "directoryEntry", entryId }, { fields });
      await client.entry.publish({ entryId }, created);
      console.log(`✓ ${entryId}  "${item.name.en}"  [${item.cat}]`);
    } catch (e) {
      console.log(`! ${entryId}:`, e.message);
    }
  }

  console.log("\n✨ Done.");
}

main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
