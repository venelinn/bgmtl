/**
 * Sponsors page (/sponsors): page header "Станете *спонсор*", a "why sponsor"
 * section (info cards) and three yearly sponsorship tiers (tier cards, the
 * middle one featured). Every CTA opens the contact form on the Partnership
 * topic.
 *
 * Needs migrations 2026-11-17-heading-accent.js and 2026-11-17-sponsor-tiers.js.
 * Reuses the existing (draft) sponsors page entry and its pageName; replaces
 * its sections. Id-targeted and idempotent.
 *
 * Prices follow comparable community groups in Canada (e.g. $250 / $500 /
 * $1,000 a year); change them here or in Contentful.
 *
 *   node contentful/add-sponsors-page.cjs            # dry run: print the texts
 *   node contentful/add-sponsors-page.cjs --publish  # create/update and publish
 */
require("dotenv").config();
const cm = require("contentful-management");

const PUBLISH = process.argv.includes("--publish");
const PAGE_ID = "1n5l73CdqcB8FPFLtRvxdt";
const LOCALES = ["bg-BG", "en-CA", "fr-CA"];
const PREFIX = { "bg-BG": "", "en-CA": "/en", "fr-CA": "/fr" };
const link = (id) => ({ sys: { type: "Link", linkType: "Entry", id } });
const bg = (value) => ({ "bg-BG": value });
const tri = (bgText, en, fr) => ({ "bg-BG": bgText, "en-CA": en, "fr-CA": fr });

const text = (value) => ({ nodeType: "text", value, marks: [], data: {} });
const paragraph = (value) => ({ nodeType: "paragraph", data: {}, content: [text(value)] });
const doc = (...nodes) => ({ nodeType: "document", data: {}, content: nodes });
const list = (items) => ({
  nodeType: "unordered-list",
  data: {},
  content: items.map((value) => ({ nodeType: "list-item", data: {}, content: [paragraph(value)] })),
});
const localized = (build) => Object.fromEntries(LOCALES.map((loc) => [loc, build(loc)]));

const PAGE = {
  heading: tri("Станете", "Become a", "Devenez"),
  accent: tri("спонсор", "sponsor", "commanditaire"),
  intro: tri(
    "BGMTL събира българите в Монреал — с културни събития, новини и указател на общността. Като спонсор подкрепяте тази работа и представяте бизнеса си пред общността.",
    "BGMTL brings Bulgarians in Montréal together — with cultural events, news and a community directory. As a sponsor you support this work and present your business to the community.",
    "BGMTL rassemble les Bulgares de Montréal — événements culturels, actualités et répertoire de la communauté. En devenant commanditaire, vous soutenez ce travail et faites connaître votre entreprise à la communauté.",
  ),
  metaTitle: tri("Станете спонсор на BGMTL", "Become a BGMTL sponsor", "Devenez commanditaire de BGMTL"),
  metaDescription: tri(
    "Спонсорски пакети за бизнеси, които искат да подкрепят българската общност в Монреал: видимост на сайта, на събитията и в бюлетина.",
    "Sponsorship packages for businesses that want to support the Bulgarian community in Montréal: visibility on the site, at events and in the newsletter.",
    "Forfaits de commandite pour les entreprises qui veulent soutenir la communauté bulgare de Montréal : visibilité sur le site, aux événements et dans l’infolettre.",
  ),
};

const WHY = {
  heading: tri("Защо да станете спонсор", "Why become a sponsor", "Pourquoi devenir commanditaire"),
  cards: [
    {
      key: "visibility",
      icon: "Megaphone",
      title: tri("Видимост в общността", "Visibility in the community", "Visibilité dans la communauté"),
      text: tri(
        "Името ви достига до българите в Монреал чрез сайта, събитията и месечния бюлетин.",
        "Your name reaches Bulgarians in Montréal through the site, our events and the monthly newsletter.",
        "Votre nom rejoint les Bulgares de Montréal par le site, nos événements et l’infolettre mensuelle.",
      ),
    },
    {
      key: "culture",
      icon: "HeartHandshake",
      title: tri("Подкрепа за културата", "Support for culture", "Soutien à la culture"),
      text: tri(
        "Средствата отиват за културни събития, празници и инициативи, които пазят българските традиции в Монреал.",
        "The funds go to cultural events, celebrations and initiatives that keep Bulgarian traditions alive in Montréal.",
        "Les fonds servent aux événements culturels, aux fêtes et aux initiatives qui font vivre les traditions bulgares à Montréal.",
      ),
    },
    {
      key: "local",
      icon: "Store",
      title: tri("Местна връзка", "A local connection", "Un lien local"),
      text: tri(
        "Покажете на клиентите си, че сте част от общността и подкрепяте живота ѝ тук.",
        "Show your customers that you are part of the community and support its life here.",
        "Montrez à vos clients que vous faites partie de la communauté et que vous soutenez sa vie ici.",
      ),
    },
  ],
};

const TIERS = {
  heading: tri("Спонсорски пакети", "Sponsorship packages", "Forfaits de commandite"),
  note: tri(
    "Сумите са годишни. Отворени сме и за индивидуален пакет или спонсорство на конкретно събитие — пишете ни.",
    "Amounts are per year. We are also open to a custom package or to sponsoring a specific event — get in touch.",
    "Les montants sont annuels. Nous sommes aussi ouverts à un forfait sur mesure ou à la commandite d’un événement précis — écrivez-nous.",
  ),
  cta: tri("Свържете се", "Get in touch", "Nous joindre"),
  tiers: [
    {
      key: "friend",
      icon: "Heart",
      name: tri("Приятел", "Friend", "Ami"),
      price: tri("250 $ / година", "$250 / year", "250 $ / an"),
      benefits: {
        "bg-BG": ["Име и лого на страницата „Спонсори“", "Благодарност в месечния бюлетин"],
        "en-CA": ["Name and logo on the Sponsors page", "Thank-you in the monthly newsletter"],
        "fr-CA": ["Nom et logo sur la page Commanditaires", "Remerciement dans l’infolettre mensuelle"],
      },
    },
    {
      key: "partner",
      icon: "Handshake",
      featured: true,
      name: tri("Партньор", "Partner", "Partenaire"),
      price: tri("500 $ / година", "$500 / year", "500 $ / an"),
      benefits: {
        "bg-BG": ["Всичко от „Приятел“", "Лого на плакатите и банерите на събитията", "Публикация във Facebook страницата ни"],
        "en-CA": ["Everything in Friend", "Logo on event posters and banners", "A post on our Facebook page"],
        "fr-CA": ["Tout ce qui est inclus dans Ami", "Logo sur les affiches et bannières des événements", "Une publication sur notre page Facebook"],
      },
    },
    {
      key: "main",
      icon: "Crown",
      name: tri("Главен спонсор", "Main sponsor", "Commanditaire principal"),
      price: tri("1 000 $ / година", "$1,000 / year", "1 000 $ / an"),
      benefits: {
        "bg-BG": [
          "Всичко от „Партньор“",
          "Водещо място на страницата „Спонсори“",
          "Благодарност от сцената на нашите събития",
          "Специално представяне в бюлетина и във Facebook",
        ],
        "en-CA": [
          "Everything in Partner",
          "Top spot on the Sponsors page",
          "Thank-you from the stage at our events",
          "A feature in the newsletter and on Facebook",
        ],
        "fr-CA": [
          "Tout ce qui est inclus dans Partenaire",
          "Place de choix sur la page Commanditaires",
          "Remerciement sur scène lors de nos événements",
          "Une présentation dans l’infolettre et sur Facebook",
        ],
      },
    },
  ],
};

// Every entry to write, leaves first so links resolve when the page publishes.
function plan() {
  const entries = [];

  const whyIds = WHY.cards.map((c) => {
    entries.push({
      id: `heading-sponsors-why-${c.key}`,
      type: "heading",
      fields: { title: bg(`Sponsors why: ${c.key}`), heading: c.title, as: bg("h3"), size: bg("h4") },
    });
    entries.push({
      id: `card-sponsors-why-${c.key}`,
      type: "card",
      fields: {
        title: bg(`Sponsors why: ${c.key}`),
        heading: bg(link(`heading-sponsors-why-${c.key}`)),
        content: localized((loc) => doc(paragraph(c.text[loc]))),
        icon: bg(c.icon),
        // Featured info cards render in the Bulgarian flag colours, in order.
        variant: bg("featured"),
      },
    });
    return `card-sponsors-why-${c.key}`;
  });

  entries.push({
    id: "link-sponsors-contact",
    type: "link",
    fields: {
      title: bg("Sponsors: contact"),
      name: TIERS.cta,
      url: localized((loc) => `${PREFIX[loc]}/contacts?topic=partnership#contact-form`),
      type: bg("button"),
    },
  });

  const tierIds = TIERS.tiers.map((t) => {
    entries.push({
      id: `heading-sponsors-tier-${t.key}`,
      type: "heading",
      fields: { title: bg(`Sponsors tier: ${t.key}`), heading: t.name, as: bg("h3"), size: bg("h4") },
    });
    entries.push({
      id: `card-sponsors-tier-${t.key}`,
      type: "card",
      fields: {
        title: bg(`Sponsors tier: ${t.key}`),
        heading: bg(link(`heading-sponsors-tier-${t.key}`)),
        role: t.price,
        content: localized((loc) => doc(list(t.benefits[loc]))),
        link: bg(link("link-sponsors-contact")),
        icon: bg(t.icon),
        variant: bg(t.featured ? "featured" : "default"),
      },
    });
    return `card-sponsors-tier-${t.key}`;
  });

  entries.push(
    {
      id: "collection-sponsors-why",
      type: "collection",
      fields: { title: bg("Sponsors: why"), variant: bg("grid"), cardVariant: bg("info"), cards: bg(whyIds.map(link)), itemsPerRow: bg(3) },
    },
    {
      id: "collection-sponsors-tiers",
      type: "collection",
      fields: { title: bg("Sponsors: tiers"), variant: bg("grid"), cardVariant: bg("tier"), cards: bg(tierIds.map(link)), itemsPerRow: bg(3) },
    },
    {
      id: "heading-sponsors-page",
      type: "heading",
      fields: { title: bg("Sponsors: page header"), heading: PAGE.heading, accent: PAGE.accent, as: bg("h1"), size: bg("h1") },
    },
    {
      id: "heading-sponsors-why",
      type: "heading",
      fields: { title: bg("Sponsors: why"), heading: WHY.heading, as: bg("h2"), size: bg("h3") },
    },
    {
      id: "heading-sponsors-tiers",
      type: "heading",
      fields: { title: bg("Sponsors: tiers"), heading: TIERS.heading, as: bg("h2"), size: bg("h3") },
    },
    // First section: its h1 heading + description become the PageHeader band.
    {
      id: "section-sponsors-why",
      type: "section",
      fields: {
        title: bg("Sponsors: intro + why"),
        heading: bg(link("heading-sponsors-page")),
        description: localized((loc) => doc(paragraph(PAGE.intro[loc]))),
        components: bg([link("collection-sponsors-why")]),
      },
    },
    {
      id: "section-sponsors-tiers",
      type: "section",
      fields: {
        title: bg("Sponsors: tiers"),
        heading: bg(link("heading-sponsors-tiers")),
        description: localized((loc) => doc(paragraph(TIERS.note[loc]))),
        components: bg([link("collection-sponsors-tiers")]),
      },
    },
    {
      id: "metadata-page-sponsors",
      type: "metaData",
      fields: { title: bg("META: Sponsors"), pageTitle: PAGE.metaTitle, pageDescription: PAGE.metaDescription },
    },
  );
  return entries;
}

async function main() {
  for (const loc of LOCALES) {
    console.log(`\n[${loc}] ${PAGE.heading[loc]} *${PAGE.accent[loc]}* — ${PAGE.intro[loc]}`);
    for (const c of WHY.cards) console.log(`  · ${c.title[loc]}: ${c.text[loc]}`);
    for (const t of TIERS.tiers) console.log(`  ${t.featured ? "★" : "•"} ${t.name[loc]} ${t.price[loc]}: ${t.benefits[loc].join(" · ")}`);
  }
  const entries = plan();
  console.log(`\n${entries.length} entries + page ${PAGE_ID}.`);
  if (!PUBLISH) {
    console.log("Dry run. Re-run with --publish to create and publish.");
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

  for (const e of entries) {
    try {
      let entry;
      try {
        entry = await client.entry.get({ entryId: e.id });
        entry.fields = { ...entry.fields, ...e.fields };
        entry = await client.entry.update({ entryId: e.id }, entry);
      } catch (err) {
        if (!/NotFound|could not be found/i.test(err.message)) throw err;
        entry = await client.entry.createWithId({ entryId: e.id, contentTypeId: e.type }, { fields: e.fields });
      }
      await client.entry.publish({ entryId: e.id }, entry);
      console.log(`✓ ${e.type} ${e.id}`);
    } catch (err) {
      console.log(`! ${e.type} ${e.id}:`, err.message);
      process.exitCode = 1;
      return;
    }
  }

  // The existing page entry: new sections + metaData, no sidebar widgets.
  const page = await client.entry.get({ entryId: PAGE_ID });
  page.fields.sections = bg([link("section-sponsors-why"), link("section-sponsors-tiers")]);
  page.fields.metaData = bg(link("metadata-page-sponsors"));
  page.fields.sidebar = bg(false);
  page.fields.widgets = bg([]);
  const updated = await client.entry.update({ entryId: PAGE_ID }, page);
  await client.entry.publish({ entryId: PAGE_ID }, updated);
  console.log(`✓ page ${PAGE_ID} (/sponsors)`);
}

main();
