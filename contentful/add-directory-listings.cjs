/**
 * Adds the Montreal directory listings from mockData/bg-community/toadd.md as
 * `directoryEntry` entries (Management SDK — the migration CLI can't create
 * entries). Idempotent: an entry that already exists (by fixed id) is skipped.
 *
 * Category mapping is applied here (toadd.md has no tags):
 *   folk/dance ensembles → cultural-center · CPA → accountant · avocats → lawyer
 *   realtor → realtor · dentist → doctor · everything else → business.
 * Empty cities default to montreal.
 *
 *   node contentful/add-directory-listings.cjs
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
    id: "concorde-veterinary-clinic",
    name: { bg: "Ветеринарна клиника Конкорд", en: "Concorde Veterinary Clinic", fr: "Clinique Vétérinaire Concorde" },
    cat: "business",
    phone: "450-661-6868",
    email: "info@veterinaireconcorde.ca",
    website: "https://www.veterinaireconcorde.ca/",
    address: "3087 Blvd. de la Concorde E, Laval, QC H7E 2C1",
    note: "Гергана Христова / Gergana Hristova",
  },
  {
    id: "ned-ivanov",
    name: { bg: "Недко Иванов", en: "Ned Ivanov", fr: "Ned Ivanov" },
    cat: "business",
    phone: "780-717-6608",
    email: "nekvision@yahoo.com",
    website: "https://www.nekgroupe.com/",
  },
  {
    id: "diana-koeff",
    name: { bg: "Диана Кьофева, CPA, CGA", en: "Diana Koeff, CPA, CGA", fr: "Diana Koeff, CPA, CGA" },
    cat: "accountant",
    phone: "514-824-2702",
    email: "info@dianakoeffcpa.com",
    website: "https://dianakoeffcpa.com",
  },
  {
    id: "teodora-manova",
    name: { bg: "Теодора Манова", en: "Teodora Manova", fr: "Teodora Manova" },
    cat: "lawyer",
    phone: "514-274-0365 #5454",
    email: "tmanova@nexusavocats.com",
    website: "https://www.nexusavocats.com",
    address: "7479 Rue Saint-Hubert, Québec, H2R 2N5",
  },
  {
    id: "urban-bee",
    name: { bg: "Abeille Urbaine", en: "Urban Bee", fr: "Abeille Urbaine" },
    cat: "business",
    phone: "514-910-5182",
    email: "abeilleurbaine@hotmail.com",
    website: "https://www.abeilleurbaine.com/",
    address: "4455 Cleroux, Laval, QC H7T 2G3",
    note: "Ivan Ilchev / Иван Илчев",
  },
  {
    id: "iliyana-yakimova",
    name: { bg: "Илияна Якимова", en: "Iliyana Yakimova", fr: "Iliyana Yakimova" },
    cat: "business",
    email: "ilityyakimova@gmail.com",
    website: "https://iyakimova.com/",
  },
  {
    id: "fovero-barbershop-ndg",
    name: { bg: "Фоверо Барбершоп", en: "Fovero Barbershop NDG", fr: "Fovero Barbershop NDG" },
    cat: "business",
    phone: "438-458-8916",
    address: "6570 Av. Somerled, Montréal, QC H4V 1S9",
    note: "Стойчо / Stoycho",
  },
  {
    id: "salon-kaaz",
    name: { bg: "Венера Генова / Salon Kaaz", en: "Venera Genova / Salon Kaaz", fr: "Venera Genova / Salon Kaaz" },
    cat: "business",
    phone: "514-276-7000",
    website: "https://www.instagram.com/hairby_veni/",
    address: "Av Laurier E, Montréal QC H2J 1G3",
  },
  {
    id: "nastya-petkova",
    name: { bg: "Д-р Настя Петкова", en: "Dr. Nastya Petkova", fr: "Dr. Nastya Petkova" },
    cat: "doctor",
    phone: "(514) 699-5232",
    email: "drnastya.petkova@gmail.com",
    website: "https://excellencedentaire.com/",
    address: "1553 Rue Viel, Montréal, QC H3M 1G6",
  },
  {
    id: "soleil-folklorique",
    name: { bg: "Фолклорно Слънце", en: "Soleil Folklorique", fr: "Soleil Folklorique" },
    cat: "cultural-center",
    phone: "514-663-8284",
    email: "soleilfolklorique.bg@gmail.com",
    website: "https://www.facebook.com/profile.php?id=61575308376127",
    note: "Роси Григорова / Rosi Grigorova",
  },
  {
    id: "lina-essentials",
    name: { bg: "Lina Essentials", en: "Lina Essentials", fr: "Lina Essentials" },
    cat: "business",
    email: "ilityyakimova@gmail.com",
    website: "https://linaessentials.com/",
  },
  {
    id: "trakya-montreal",
    name: {
      bg: "Тракия Монреал - Фолклорен Танцов Ансамбъл",
      en: "Trakya Montreal - Folk Dance Ensemble",
      fr: "Trakya Montreal - Ensemble de danse folklorique",
    },
    cat: "cultural-center",
    phone: "514-569-9026",
    email: "trakyamontreal@gmail.com",
    website: "https://www.facebook.com/profile.php?id=61562459842771",
  },
  {
    id: "daniel-katev",
    name: { bg: "Даниел Кътев", en: "Daniel Katev", fr: "Daniel Katev" },
    cat: "business",
    phone: "514-906-7785",
    email: "info@danielkatev.com",
    website: "https://danielkatev.com/",
    address: "4950 Ch. Queen Mary #320, Montreal, QC H3W 1X3",
  },
  {
    id: "balkani",
    name: { bg: "Балкани - Танцова Компания", en: "Balkani - Compagnie De Danse", fr: "Balkani - Compagnie De Danse" },
    cat: "cultural-center",
    phone: "514-929-9943",
    email: "balkani@hotmail.ca",
    website: "https://www.facebook.com/BalkaniCompagnieDeDanse/",
  },
  {
    id: "mila-stoyanova",
    name: { bg: "Мила Стоянова", en: "Mila Stoyanova", fr: "Mila Stoyanova" },
    cat: "realtor",
    phone: "514-512-1390",
    website:
      "https://www.realtor.ca/agent/2063327/mila-stoyanova-101-rue-amherst-beaconsfield-quebec-h9w5y7",
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
